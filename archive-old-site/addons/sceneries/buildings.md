---
layout: page
permalink: /addons/sceneries/buildings/
title: Buildings
---


<div id="archives">
  <div class="archive-group">

    <h3 class="category-head">Landmarks</h3>

    {% assign buildings =  site.data.sceneries | where:"type", "buildings" %}

    <table>
      <tr>
        <th>name</th>
        <th>city</th>
        <th>country</th>
        <th>link</th>
        <th>author</th>
      </tr>
 
        {% for building in buildings %}
        <tr>
          <td>{{building.name}}</td>
          <td>{{building.city}}</td>
          <td>{{building.country}}</td>          
          <td><a href="{{building.url}}" target="_blank">open</a></td>
          <td>
            {% if building.source == "reddit" %}
              <a href="https://www.reddit.com/user/{{building.author}}" target="_blank">{{building.author}}</a>
            {% else %}
              {{building.author}}
            {% endif %}
          </td>          
        </tr>
        {% endfor %}  
    </table> 
  </div>
</div>