<?php
/*
Template Name: Contact Page
*/

$context = Timber::get_context();
$post = Timber::get_post();

$templates = array( 'contact-page.twig' );

$context['post'] = $post;

Timber::render($templates, $context);
