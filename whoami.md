---
layout: page
nav_id: whoami
og_slug: whoami
title: whoami(1)
prompt: whoami
bar_label: WHOAMI(1)
page_title: NAME
tagline: "whoami - who I actually am which I need not say"
description: >-
  Welcome to the whoami man pages of wa1kerverse. Get to know who I am
  and about what I do.
---
<section>
  <h2 class="section-label">Output</h2>
  <div class="kv">
    <div class="kv-row"><span class="k">I use</span><span class="v"><a href="https://archlinux.org">Arch</a> BTW; my brain; alongside with <a href="https://nixos.org">Nix</a> package manager for tests</span></div>
    <div class="kv-row"><span class="k">I am</span><span class="v">what I am - a true self learner who happens to dive into low-level, systems-programming and cyber-security, especially offensive security - cause I am a student who is just getting into cyber security</span></div>
    <div class="kv-row"><span class="k">I love</span><span class="v">nature, and ask rebellious questions against political systems; not public enough to get knocked down by the police or military</span></div>
    <div class="kv-row"><span class="k">I believe</span><span class="v">in Gita 2.47 and 2.53, nothing less or more; information is weapon and those who know how to handle a double edged sword fight - will survive</span></div>
  </div>
</section>

<section>
  <h2 class="section-label">Skills &amp; Languages</h2>
  <div class="split-container" id="skills-split">
    <div class="card-grid" id="skills-grid">
      {% for item in site.data.skills %}
      <button class="card" data-key="{{ item[0] }}" aria-pressed="false"><i class="{{ item[1].icon }}"></i><span class="card-name">{{ item[1].name }}</span></button>
      {% endfor %}
    </div>
    <div class="detail-pane" id="skills-detail" hidden>
      <button class="detail-close" aria-label="Close detail">&times;</button>
      <div class="detail-content"></div>
    </div>
  </div>
</section>

<script>
  var skillsData = {
    {% for item in site.data.skills %}
    {{ item[0] | jsonify }}: {
      title: {{ item[1].title | jsonify }},
      iconClass: {{ item[1].icon | jsonify }},
      body: {{ item[1].body | jsonify }}
    }{% unless forloop.last %},{% endunless %}
    {% endfor %}
  };
  document.addEventListener('DOMContentLoaded', function () {
    initSplitGrid('skills-split', 'skills-grid', 'skills-detail', skillsData);
  });
</script>
