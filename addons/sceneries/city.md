---
layout: page
permalink: /addons/sceneries/cities/
title: Cities
---


<div id="archives">
  <div class="archive-group">

    <h3 class="category-head">Cities</h3>

    {% assign cities =  site.data.sceneries | where:"type", "city" %}

    <table>
      <tr>
        <th>name</th>
        <th>city</th>
        <th>country</th>
        <th>link</th>
        <th>author</th>
      </tr>
 
        {% for city in cities %}
        <tr>
          <td>{{city.name}}</td>
          <td>{{city.city}}</td>
          <td>{{city.country}}</td>          
          <td><a href="{{city.url}}" target="_blank">open</a></td>
          <td>
            {% if city.source == "reddit" %}
              <a href="https://www.reddit.com/user/{{city.author}}" target="_blank">{{city.author}}</a>
            {% else %}
              {{city.author}}
            {% endif %}
          </td>          
        </tr>
        {% endfor %}  
    </table> 
  </div>
</div>