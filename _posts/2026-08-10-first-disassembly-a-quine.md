---
title: "A Quine in the Wild: Reconstructing C from x86-64 Assembly"
date: 2026-08-10
nav_id: blog
og_slug: "blog::quine-re"
prompt: cat blog/first-disassembly-a-quine.log
bar_label: BLOG(1)
page_title: NAME
tagline: "re: reverse engineering a C quine from binary"
description: >-
  This is my first reverse engineering work, a RE on a binary file named - elf. Though it was hard for the first time doing it, all I had to do is use objdump on that binary and go through raw assembly. Through this, I get an idea on how all these things work. Note that this is a primitive yet interesting binary.
tags: [reverse-engineering, assembly, x86-64, c, quine, abi]
see_also:
  - label: sysv abi
    url: "https://refspecs.linuxbase.org/elf/x86_64-abi-0.99.pdf"
    text: System V AMD64 ABI specification
  - label: objdump
    url: "https://man7.org/linux/man-pages/man1/objdump.1.html"
    text: objdump(1) — GNU binary utilities
---
<section markdown="1">

## The Introduction
{: .section-label }

<div class="description" markdown="1">

This is a single stripped ELF binary, that I don't know what it is - the rule is that I should not execute it unless I figured out what it is. I tried `catting` it out, seems like it is just raw bytes. 

**Clearance 1** : I have got no hints, but just a binary file which you can download from [here](../assets/blogs/binaries/elf).

It turns out to be a **quine** - a program whose only output is its own source code. That makes it an interesting RE target because the format string hidden in `.rodata` *is* the answer, and finding it means reading raw bytes that the disassembler happily misinterprets as nonsense instructions. But remember, we still do not know what `elf` is. 

This post is a walkthrough of every step: stack mechanics, the System V AMD64 calling convention, variadic argument spilling onto the stack, and manual byte-by-byte decoding of a C string from a data section that `objdump` was never asked to decode. `objdump` does not show us all the bytes. Some bytes are meant to be transformed into assembly instructions, only some are valid strings. 

</div>
</section>

<section markdown="1">

## The Disassembly Section
{: .section-label }

<div class="description" markdown="1">

Here is the full `main`, straight from `objdump`:

**Clearance 2** : To get the similarly same output as below, you have to have `objdump` installed in your system and run the following command. 

```bash
objdump -d -M intel ./elf
# provided that you have the elf binary downloaded from the clearance 1.
```

```txt
0000000000001139 <main>:
    1139:  55                      push   rbp
    113a:  48 89 e5                mov    rbp,rsp
    113d:  48 83 ec 10             sub    rsp,0x10
    1141:  48 8d 05 c0 0e 00 00    lea    rax,[rip+0xec0]   # 2008
    1148:  48 89 45 f8             mov    QWORD PTR [rbp-0x8],rax
    114c:  48 8b 45 f8             mov    rax,QWORD PTR [rbp-0x8]
    1150:  48 83 ec 08             sub    rsp,0x8
    1154:  6a 0a                   push   0xa
    1156:  6a 0a                   push   0xa
    1158:  6a 09                   push   0x9
    115a:  6a 0a                   push   0xa
    115c:  6a 09                   push   0x9
    115e:  6a 0a                   push   0xa
    1160:  6a 22                   push   0x22
    1162:  ff 75 f8                push   QWORD PTR [rbp-0x8]
    1165:  6a 22                   push   0x22
    1167:  41 b9 09 00 00 00       mov    r9d,0x9
    116d:  41 b8 0a 00 00 00       mov    r8d,0xa
    1173:  b9 0a 00 00 00          mov    ecx,0xa
    1178:  ba 0a 00 00 00          mov    edx,0xa
    117d:  be 0a 00 00 00          mov    esi,0xa
    1182:  48 89 c7                mov    rdi,rax
    1185:  b8 00 00 00 00          mov    eax,0x0
    118a:  e8 a1 fe ff ff          call   1030 <printf@plt>
    118f:  48 83 c4 50             add    rsp,0x50
    1193:  b8 00 00 00 00          mov    eax,0x0
    1198:  c9                      leave
    1199:  c3                      ret
```

I have already a lot to unpack. Let's go piece by piece.

</div>
</section>

<section markdown="1">

## Setting up the Stack Frame
{: .section-label }

<div class="description" markdown="1">

The first three instructions are the standard prologue:

```txt
push   rbp          ; save caller's base pointer
mov    rbp, rsp     ; set our own frame base
sub    rsp, 0x10    ; reserve 16 bytes of local space
```

`push` is two micro-operations back to back: `sub rsp, 8` then `mov [rsp], <value>`. The stack grows *downward*, so pushing something expands it toward lower addresses.

When the linker's `_start` calls `main`, the return address is already sitting on the stack, which means RSP is 8-byte aligned but not 16-byte aligned at that moment. `push rbp` subtracts another 8 bytes, which brings RSP back to a 16-byte boundary. After that, `sub rsp, 0x10` keeps it aligned and carves out 16 bytes of local variable space.

> The System V AMD64 ABI requires RSP to be 16-byte aligned **before** every `call` instruction. The `push rbp` at the very top of `main` is what restores that invariant, since `_start` already knocked it off by 8 when it called us.

With 16 bytes reserved, we have room for two 8-byte locals. Only one is actually used here: `[rbp-0x8]`.

So, basically the first instruction `push` copies the caller's base pointer onto the stack, writing 8 bytes (standard pointer size in x86-64), after making room to accommodate the pointer by micro-operation `sub rsp, 8`. 

Then the next instruction `mov` copies into the `rbp` (base pointer) the current `rsp`'s value (i.e, stack pointer) to setup a new stack frame for the `main` function. 

The final instruction in standard prologue is reserving the space, 16 bytes. (it is 16 and not any other lesser or non multiple as stack address requires to be a multiple of 16)

</div>
</section>

<section markdown="1">

## Loading the format string pointer
{: .section-label }

<div class="description" markdown="1">

```txt
lea    rax, [rip+0xec0]      ; rax = address of something at 0x2008
mov    QWORD PTR [rbp-0x8], rax   ; store it as a local variable
mov    rax, QWORD PTR [rbp-0x8]   ; load it back into rax
```

`lea` does not dereference - it just computes and stores the address. The comment from `objdump` tells us the resolved address is `0x2008`, which lands inside a section the disassembler labelled `_IO_stdin_used` (a read-only data sentinel the linker drops in). The actual string *starts* at `0x2008`.

The store-then-immediately-load looks redundant and probably is - a compiler generating unoptimised code (`-O0`) will faithfully write and re-read every local even when it doesn't have to. The net result: `rax` holds a pointer to the format string.

This address is computed using **RIP-relative addressing**: instead of embedding an absolute address (which would break position-independent executables), the instruction says "whatever address I'm currently at, plus 0xec0." At link time that offset is calculated so the target is always `0x2008` regardless of where the binary gets mapped. `rip` is a register - **Register Instruction Pointer**, which points to the next instruction that is to be executed by the CPU. 

`QWORD PTR` : these words are just denoting that the dereferenced address is 8 bytes (quad-word) and is a pointer. 

</div>
</section>

<section markdown="1">

## Why there are 15 arguments and where they go
{: .section-label }

<div class="description" markdown="1">

The System V AMD64 ABI lets you pass the first six integer/pointer arguments in registers, in order:

I need to remember these registers in my mind, so as to setup the correct arguments. 

```txt
rdi, rsi, rdx, rcx, r8, r9
```

`printf` here takes **15 arguments** (one format string plus fourteen values). Six fit in registers; the remaining nine have to go on the stack. The ABI says stack arguments are pushed **right-to-left**, so the last argument gets pushed first and ends up deepest in the stack, while argument 7 (the first stack argument) is pushed last and ends up shallowest — right where `printf` can pick it up.

- How did I figure out the 15 arguments? It is just we need to remember what is moved into the registers. 
- The first 6 registers that are meant to take up arguments for a function call took the following values as provided in the below table. 
- And there were also `push` instruction that is copying those values onto the stack, hence growing the stack downwards. Normally, when the registers meant for storing arguments are exhausted, the `printf` function reads it from the stack, as long as the number of `formatters` in the `format string` (first argument) is satisfied. 
- But here, the first argument is in the `rdi` (register destination index) and that is having a pointer to an address, and relative to `rip`, the address is `2008`. But in our `objdump` output, that address was not shown, because it was in a `.rodata` section and we need to use the `-D flag` instead of the `-d flag`. 

**Clearance 3** : Therefore, the format string has 14 format specifiers (formatters) and hence, 5 of them stored in registers and the rest of them `push`ed onto the stack.

Mapping every argument, we just need to write down what is pushed on the stack:

| # | Location | Value | Meaning |
|---|----------|-------|---------|
| 1 | `rdi` | `0x2008` pointer | format string |
| 2 | `rsi` | `0xa` | `'\n'` |
| 3 | `rdx` | `0xa` | `'\n'` |
| 4 | `rcx` | `0xa` | `'\n'` |
| 5 | `r8d` | `0xa` | `'\n'` |
| 6 | `r9d` | `0x9` | `'\t'` |
| 7 | stack | `0x22` = 34 | `'"'` |
| 8 | stack | `[rbp-0x8]` | pointer to `fixed` (the string itself) |
| 9 | stack | `0x22` = 34 | `'"'` |
| 10 | stack | `0xa` | `'\n'` |
| 11 | stack | `0x9` | `'\t'` |
| 12 | stack | `0xa` | `'\n'` |
| 13 | stack | `0x9` | `'\t'` |
| 14 | stack | `0xa` | `'\n'` |
| 15 | stack | `0xa` | `'\n'` |

Notice argument 8: `push QWORD PTR [rbp-0x8]` — this dereferences the local variable and pushes the *pointer value* itself. So `printf` receives the address of the format string *as one of its own arguments*. Mm, interesting takeaway. What string will take itself as its format string? 

The `sub rsp, 0x8` before the pushes (at `0x1150`) is just there to maintain 16-byte alignment as the nine stack arguments are being assembled. After `printf` returns, `add rsp, 0x50` cleans the whole thing up: `0x50` = 80 bytes = 8 (alignment pad) + 9×8 (stack args).

Here, the last argument should be pushed first onto the stack because the stack is **first in first out** datastructure. Therefore, whatever is pushed at last will be the `printf`'s next argument. 

Notice these `push` instructions. 

```txt
1154:  6a 0a                   push   0xa
1156:  6a 0a                   push   0xa
1158:  6a 09                   push   0x9
115a:  6a 0a                   push   0xa
115c:  6a 09                   push   0x9
115e:  6a 0a                   push   0xa
1160:  6a 22                   push   0x22
1162:  ff 75 f8                push   QWORD PTR [rbp-0x8]
1165:  6a 22                   push   0x22

```

</div>
</section>

<section markdown="1">

## Decoding the format string from raw bytes
{: .section-label }

<div class="description" markdown="1">

The string lives in the read-only data section starting at `0x2008`. `objdump -D` disassembles *everything*, including data sections, so it reads those bytes and prints them as if they were x86 instructions — producing nonsense like:

```txt
2008:  23 69 6e    and  ebp,DWORD PTR [rcx+0x6e]
200b:  63 6c 75 64 movsxd ebp,DWORD PTR [rbp+rsi*2+0x64]
```

Those are not real instructions, reverse engineers call them *pseudo instructions*. They are character bytes being misread as *opcodes* (assembly instruction keywords). The actual data is just the ASCII values, (which I just copied that entire section starting from `2008` till end of section, put into **gemini** to provide raw bytes mapped into ascii characters):

| Hex | Char |
|-----|------|
| `23` | `#` |
| `69` | `i` |
| `6e` | `n` |
| `63` | `c` |
| `6c` | `l` |
| `75` | `u` |
| `64` | `d` |
| `65` | `e` |
| `20` | ` ` |
| `3c` | `<` |
| `73` | `s` |
| ... | ... |

The null terminator (`00`) marks the end. You can verify the whole thing instantly with:

```bash
strings elf
```

The full format string is:

{% raw %}

```c
#include <stdio.h>%c#include <stdlib.h>%c%cint main(void) {%c%cconst char* fixed = %c%s%c;%c%cprintf(fixed, 10, 10, 10, 10, 9, 34, fixed, 34, 10, 9, 10, 9, 10, 10);%c%creturn EXIT_SUCCESS;%c}%c
```

{% endraw %}

Every `%c` gets substituted with a character value from the argument list. With `'\n'` (10) and `'\t'` (9) in the right slots, the output is properly indented C source. The `%s` in the middle gets the pointer to `fixed` itself - argument 8 - so the string prints *its own contents* as the value of the `fixed` variable. That is the quine mechanism.

</div>
</section>

<section markdown="1">

## The reconstructed source
{: .section-label }

<div class="description" markdown="1">

Putting it all together:

{% raw %}

```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {

  const char* fixed = "#include <stdio.h>%c#include <stdlib.h>%c%cint main(void) {%c%cconst char* fixed = %c%s%c;%c%cprintf(fixed, 10, 10, 10, 10, 9, 34, fixed, 34, 10, 9, 10, 9, 10, 10);%c%creturn EXIT_SUCCESS;%c}%c";

  printf(fixed, 10, 10, 10, 10, 9, 34, fixed, 34, 10, 9, 10, 9, 10, 10);

  return EXIT_SUCCESS;

}
```

{% endraw %}

Run it, and it prints itself. That is the whole program.

> The string is both the format template *and* the data being formatted. `%s` is the slot where `fixed` gets inserted back in — verbatim, quotes included (argument 7 is `"`, argument 8 is the pointer, argument 9 is `"` again). Everything else is just whitespaces and stuffs I don't still get yet, weird bytes.

</div>
</section>

<section markdown="1">

## So, what is it finally?
{: .section-label }

<div class="description" markdown="1">

A few things were noticed during this that weren't obvious previously, like these:

**Stack argument ordering is counter-intuitive at first.** Arguments beyond the sixth are pushed right-to-left, so argument 15 is on the stack deepest and argument 7 sits on top. Once you know `printf` reads them left-to-right from where `rsp` points after the call, the ordering should probably make sense to you as it did to me - it mirrors how a function's stack frame naturally works.

**`objdump -d` on a data section is actively misleading.** The disassembler does not know where code ends and data begins in a stripped binary unless it has section headers to guide it. Treating `.rodata` bytes as opcodes produces syntactically valid but semantically meaningless output. The right move is to extract the bytes at the known address and decode them as ASCII, or just run `strings`.

**RIP-relative addressing is the default in PIE binaries.** `lea rax, [rip+0xec0]` is not exotic : it is how GCC generates every reference to a global or string literal in a position-independent executable. The offset is baked in at link time and the absolute address resolves at load time.

**`-O0` output is verbose but readable.** The pointless `mov [rbp-0x8], rax` / `mov rax, [rbp-0x8]` cycle is a compiler artefact from storing and reloading every value through its stack slot. An optimised build would have eliminated that entirely, making the disassembly shorter but also collapsing the explicit local variable - potentially harder to follow, not easier, but with only a few lines of C code, it would be just a **little** harder.

**And that's it, this is my first disassembly on a Quine.**

</div>
</section>

