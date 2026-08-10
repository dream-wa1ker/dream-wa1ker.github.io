---
layout: page
nav_id: projects
og_slug: projects
title: projects(1)
prompt: man dream-wa1ker-projects
bar_label: PROJECTS(1)
page_title: NAME
tagline: "projects - what I'm actually building"
description: >-
  Directory - Projects of wa1kerverse. Explore the projects that I create
  locally and provide explanations for whatever it has become.
---
<section>
  <h2 class="section-label">Functions</h2>
  <div class="split-container" id="projects-split">
    <div class="card-grid" id="projects-grid">
      {% for item in site.data.projects %}
      <button class="card" data-key="{{ item[0] }}" aria-pressed="false"><i class="{{ item[1].icon }}"></i><span class="card-name">{{ item[1].name }}</span></button>
      {% endfor %}
    </div>
    <div class="detail-pane" id="projects-detail" hidden>
      <button class="detail-close" aria-label="Close detail">&times;</button>
      <div class="detail-content"></div>
    </div>
  </div>
</section>

<script>
  var projectsData = {
    {% for item in site.data.projects %}
    {{ item[0] | jsonify }}: {
      title: {{ item[1].title | jsonify }},
      iconClass: {{ item[1].icon | jsonify }},
      body: {{ item[1].body | jsonify }}
    }{% unless forloop.last %},{% endunless %}
    {% endfor %}
  };
  document.addEventListener('DOMContentLoaded', function () {
    initSplitGrid('projects-split', 'projects-grid', 'projects-detail', projectsData);
  });
</script>
