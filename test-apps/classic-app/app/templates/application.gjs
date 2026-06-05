import { pageTitle } from 'ember-page-title';

<template>
  {{pageTitle "ClassicApp"}}
  <h1>Demo ember-import-meta-glob with pets</h1>
  <p data-test="eager-cats">Team eager #cats: {{@model.cats}}</p>
  <p data-test="eager-dogs">Team eager #dogs: {{@model.dogs}}</p>
  <p data-test="lazy-rabbits">Team lazy #rabbits: {{@model.rabbits}}</p>
  <p data-test="lazy-turtles">Team lazy #turtles: {{@model.turtles}}</p>
</template>
