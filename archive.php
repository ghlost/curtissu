<?php
/**
* Index template
*
* A fallback list template used if a more specific template is not available
*
*/

if (! class_exists('Timber')) {
    echo 'Timber not activated. Make sure you activate the plugin in ' .
    '<a href="/wp-admin/plugins.php#timber">/wp-admin/plugins.php</a>';
    return;
}
$context = Timber::get_context();
$context['page'] = Timber::get_post();

$postArgs = array(
  'post_type' => ['post'],
  'posts_per_page' => 20,
  'orderby' => array(
    'date' => 'DESC'
  )
);

if ( is_category() ) {
  $context['cat_title'] = single_cat_title( '', false );
}

$context['posts'] = new Timber\PostQuery();
$templates = array( 'projects.twig' );

Timber::render($templates, $context);
