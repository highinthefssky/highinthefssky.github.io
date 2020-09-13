---
layout: page
permalink: /addons/sceneries/landmarks
title: Landmarks
---


<div id="archives">
  <div class="archive-group">

    <h3 class="category-head">Landmarks</h3>

    {% assign landmarks =  site.data.sceneries | where:"type", "landmark" %}

    <table>
      <tr>
        <th>name</th>
        <th>city</th>
        <th>country</th>
        <th>download</th>
        <th>author</th>
      </tr>
 
        {% for landmark in landmarks %}
        <tr>
          <td>{{landmark.name}}</td>
          <td>{{landmark.city}}</td>
          <td>{{landmark.country}}</td>          
          <td><a href="{{landmark.url}}" target="_blank">open</a></td>
          <td>
            {% if landmark.source == "reddit" %}
              <a href="https://www.reddit.com/user/{{landmark.author}}" target="_blank">{{landmark.author}}</a>
            {% else %}
              {{landmark.author}}
            {% endif %}
          </td>          
        </tr>
        {% endfor %}  
    </table> 
  </div>
</div>