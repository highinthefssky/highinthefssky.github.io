---
layout: post
title: "Latest addons: week 37"
description: "This is an overview of the community addons released in week 37 for Flight Simulator 2020"
tags:
- Flight Simulator 2020
- microsoft flight simulator
- flight simulator
- microsoft flight simulator 2020
- msfs 2020,tutorials
- flight training
- flight sim 2020
- addons
- FS2020 airplane addons
- FS2020 scenery addons
- FS2020 liveries
category: tutorials
permalink: /MSFS2020-Latest-Added-Week-37/
---

Below an overview of the addons released in week 37:

 
{% assign timeframe = 604800 %}
{% assign sceneries = site.data.sceneries %}

<h3>Sceneries</h3>
<table>
    <tr>
        <th>name</th>
        <th>city</th>
        <th>country</th>
        <th>region</th>
        <th>link</th>
        <th>author</th>       
    </tr>

     {% for scenery in sceneries %}
        {% assign release_date = scenery.date | date: "%s" | plus: 0 %}
        {% assign last_week = "2020-09-14" | date: "%s" |minus: timeframe %}
        {% assign this_week = "2020-09-14" | date: "%s" | plus: 0 %}
            {% if release_date > last_week and release_date < this_week and release_date != 0 %}
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
            {% endif %}
        {% endfor %}  
    </table> 