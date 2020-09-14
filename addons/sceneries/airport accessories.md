---
layout: page
permalink: /addons/sceneries/airportaccesories/
title: Airport accesories
---


<div id="archives">
  <div class="archive-group">

    <h3 class="category-head">Airport accessories</h3>

    {% assign accessories =  site.data.sceneries | where:"type", "airport accessories" %}

    <table>
      <tr>
        <th>name</th>
        <th>city</th>
        <th>country</th>
        <th>download</th>
        <th>author</th>
      </tr>
 
        {% for accessory in accessories %}
        <tr>
          <td>{{accessory.name}}</td>
          <td>{{accessory.city}}</td>
          <td>{{accessory.country}}</td>          
          <td><a href="{{accessory.url}}" target="_blank">open</a></td>
          <td>
            {% if accessory.source == "reddit" %}
              <a href="https://www.reddit.com/user/{{accessory.author}}" target="_blank">{{accessory.author}}</a>
            {% else %}
              {{accessory.author}}
            {% endif %}
          </td>          
        </tr>
        {% endfor %}  
    </table> 
  </div>
</div>