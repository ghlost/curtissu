<?php
/*
Template Name: About Us Page
*/

$context = Timber::get_context();
$post = Timber::get_post();

$templates = array( 'about-page.twig' );

$context['post'] = $post;

Timber::render($templates, $context);
