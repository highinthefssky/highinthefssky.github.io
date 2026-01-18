---
layout: page
permalink: /addons/airstrips/
title: Airstrips
---


<div id="archives">
  <div class="archive-group">

    <h3 class="category-head">Airstrips</h3>

    <table>
      <tr>
        <th>airport</th>
        <th>city</th>
        <th>country</th>
        <th>link</th>
        <th>author</th>
      </tr>
 
        {% for airstrip in site.data.airstrips %}
        <tr>
          <td>{{airstrip.name}}</td>
          <td>{{airstrip.city}}</td>
          <td>{{airstrip.country}}</td>          
          <td><a href="{{airstrip.url}}" target="_blank">open</a></td>
          <td>
            {% if airstrip.source == "reddit" %}
              <a href="https://www.reddit.com/user/{{airstrip.author}}" target="_blank">{{airstrip.author}}</a>
            {% else %}
              {{airstrip.author}}
            {% endif %}
          </td>          
        </tr>
        {% endfor %}  
    </table> 
  </div>
</div>