import { pageTitle } from 'ember-page-title'

<template>
  {{pageTitle "ViteApp"}}
  <h1>Demo ember-import-meta-glob with pets</h1>
  <p>Team eager #cats: {{@model.cats}}</p>
  <p>Team eager #dogs: {{@model.dogs}}</p>
  <p>Team lazy #rabbits: {{@model.rabbits}}</p>
  <p>Team lazy #turtles: {{@model.turtles}}</p>
</template>