---
layout: page
permalink: /addons/regions/EMEA
title: Addons - EMEA
---


<div id="archives">
  <div class="archive-group">

    <h3 class="category-head">Sceneries - EMEA</h3>
    
    {% assign sceneries =  site.data.sceneries | where:"region", "EMEA" %}

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


<div id="archives">
  <div class="archive-group">

    <h3 class="category-head">Airports - APAC</h3>
    
    {% assign airports =  site.data.airports | where:"region", "EMEA" %}

    <table>
      <tr>
        <th>name</th>
        <th>city</th>
        <th>country</th>
        <th>download</th>
        <th>author</th>
      </tr>
 
        {% for airport in site.data.airports %}
        <tr>
          <td>{{airport.name}}</td>
          <td>{{airport.city}}</td>
          <td>{{airport.country}}</td>          
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