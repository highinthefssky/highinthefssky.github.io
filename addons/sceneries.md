---
layout: page
permalink: /addons/sceneries/
title: Sceneries
---


<div id="archives">
  <div class="archive-group">

    <h3 class="category-head">Sceneries</h3>

    <table>
      <tr>
        <th>name</th>
        <th>city</th>
        <th>country</th>
        <th>download</th>
        <th>author</th>
      </tr>
 
        {% for scenery in site.data.sceneries %}
        <tr>
          <td>{{scenery.name}}</td>
          <td>{{scenery.city}}</td>
          <td>{{scenery.country}}</td>          
          <td><a href="{{scenery.url}}" target="_blank">open</a></td>
          <td>
            {% if scenery.source == "reddit" %}
              <a href="https://www.reddit.com/user/{{scenery.author}}" target="_blank">{{scenery.author}}</a>
            {% else %}
              {{scenery.author}}
            {% endif %}
          </td>          
        </tr>
        {% endfor %}  
    </table> 
  </div>
</div>