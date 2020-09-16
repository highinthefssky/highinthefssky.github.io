---
layout: page
permalink: /addons/
title: Addons
ref: addons
order: 3
---


<div id="archives">
  <div class="archive-group">

    Below an overview of community content I found around on the internet. The list is based on <a href="https://www.reddit.com/r/MicrosoftFlightSim/comments/ii0jmx/complete_community_freeware_airport_and_scenery/" target="_blank">this</a> Reddit post from <a href = "https://www.reddit.com/user/matt3788/" target=_blank>matt3788</a> as the primary source. In addition to items have been added from msfsaddons. 
    <h3 class="category-head">Airports (latest 5 additions) </h3>

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
 
        {% assign airports = site.data.airports | reverse %}
        {% for airport in airports limit:5 %}
        <tr>
          {% if airport_info != nil %}
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
            {% if scenery.source == "reddit" %}
              <a href="https://www.reddit.com/user/{{airport.author}}" target="_blank">{{airport.author}}</a>
            {% else %}
              {{airport.author}}
            {% endif %}
          </td>    
        </tr>
        {% endfor %}  
    </table> 
    
    <p>
      <a href="{{ site.baseurl }}airports/">More airports</a>
    </p>

    <h3 class="category-head">Airstrips (latest 5 additions) </h3>

    <table>
      <tr>
        <th>airstrip</th>
        <th>city</th>
        <th>country</th>
        <th>region</th>
        <th>link</th>
        <th>author</th>
      </tr>
 
        {% assign airstrips = site.data.airstrips | reverse %}
        {% for airstrip in airstrips limit:5 %}
        <tr>
          <td>{{airstrip.name}}</td>
          <td>{{airstrip.city}}</td>
          <td>{{airstrip.country}}</td>
          <td>{{airstrip.region}}</td>                      
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
    
    <p>
      <a href="{{ site.baseurl }}airstrips">More airstrips</a>
    </p>

    <h3 class="category-head">Scenery (latest 5 additions) </h3>

    <table>
      <tr>
        <th>name</th>
        <th>city</th>
        <th>country</th>
        <th>region</th>
        <th>link</th>
        <th>author</th>
      </tr>
 
        {% assign sceneries = site.data.sceneries | reverse %}
        {% for scenery in sceneries limit:5 %}
        <tr>
          <td>{{scenery.name}}</td>
          <td>{{scenery.city}}</td>
          <td>{{scenery.country}}</td>
          <td>{{scenery.region}}</td>                   
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
    
    <p>
      <a href="{{ site.baseurl }}sceneries">More sceneries</a>
    </p>    
  </div>
</div>