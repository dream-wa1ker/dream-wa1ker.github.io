---
layout: page
nav_id: blog
og_slug: blog
title: blog(1)
prompt: tail -f blog.log
bar_label: BLOG(1)
page_title: NAME
tagline: "blog - random thoughts and unrandom analysis"
description: >-
  Writeups from the wa1kerverse. These are hand forged, non AI sloped
  genuinely original content, just for reference and tool guide.
---
<section>
  <h2 class="section-label">Entries</h2>
  <div class="log-list">
    {% for post in site.posts %}
    <a class="log-entry" href="{{ post.url | relative_url }}">
      <span class="log-date">{{ post.date | date: "%Y-%m-%d" }}</span>
      <span class="log-title">{{ post.title }}</span>
      <span class="log-tagline">{{ post.description }}</span>
    </a>
    {% endfor %}
  </div>
</section>

<section markdown="1">
## Description
{: .section-label }
<div class="description" markdown="1">
This is a blog post stuff. If I am learning something new, interesting, or if some content intersect the fields of interest, debates, questions based on govt, idealogies and cybersec writeups, you can find those materials here.

There is nothing personal about this blog. Caus leaking information about me will potentially create an [information asymmetry.](https://en.wikipedia.org/wiki/Information_asymmetry) I have spend most of my school time learning school stuffs + most of my holidays learning FIOA docs and consuming lots of analysis reports - though honestly I did not understand them fully, I have got an idea of how to keep things tight - caus in a National Security thing, information disclosure is basically a threat when it comes to a third party :)
</div>
</section>
