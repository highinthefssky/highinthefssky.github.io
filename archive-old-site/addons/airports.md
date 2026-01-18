---
layout: page
permalink: /addons/airports/
title: Airports
---


<div id="archives">
  <div class="archive-group">

    <h3 class="category-head">Airports</h3>

    <table>
      <tr>
        <th>airport</th>
        <th>ICAO</th>
        <th>city</th>
        <th>country</th>
        <th>region</th>
        <th>link</th>
        <th>author</th>
      </tr>
 
        {% for airport in site.data.airports %}
        <tr>
        {% if airport_info != undefined %}
            <td><a href="{{airport_info}}" target="_blank">{{airport.name}}</a></td>
          {% else %}
            <td>{{airport.name}}</td>
          {% endif %}
          <td>{{airport.icao}}</td>
          <td>{{airport.city}}</td>
          <td>{{airport.country}}</td>
          <td>{{airport.region}}</td>           
          <td><a href="{{airport.url}}" target="_blank">open</a></td>
          <td>
            {% if airport.source == "reddit" %}
              <a href="https://www.reddit.com/user/{{airport.author}}" target="_blank">{{airport.author}}</a>
            {% else %}
              {{airport.author}}
            {% endif %}
          </td>        
        </tr>
        {% endfor %}  
    </table> 
  </div>
</div>