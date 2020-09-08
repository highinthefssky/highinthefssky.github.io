---
layout: page
permalink: /categories/
title: Categories
ref: categories
order: 2
---


<div id="archives">
{% for category in site.categories %}
  <div class="archive-group">
    {% capture category_name %}{{ category | first }}{% endcapture %}
    <div id="#{{ category_name | slugize }}"></div>
    <p></p>

    <h3 class="category-head">{{ category_name }}</h3>
    <a name="{{ category_name | slugize }}"></a>
    {% assign category_posts = site.posts | where: 'category', category_name %}
  
    {% for post in site.categories[category_name] %}
      {% if forloop.first %}
        {% assign articleIndexLength = forloop.length | minus: 1 %}
      {% endif %}
      {% if forloop.index0 < 4 %}
        <article class="archive-item">
          <h4><a href="{{ site.baseurl }}{{ post.url }}">{{post.title}}</a></h4>
        </article>
        {% else %}
        <article class="archive-item">
          <h4><a href="{{ site.baseurl }}{{category_name}}">more ..</a></h4>
        </article>
        {% break %}
      {% endif %}
    {% endfor %}
  </div>
{% endfor %}
</div>