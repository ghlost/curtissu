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
$context['home'] = Timber::get_post();

$postArgs = array(
  'post_type' => ['post'],
  'posts_per_page' => 20,
  'orderby' => array(
    'date' => 'DESC'
  )
);

$context['posts'] = new Timber\PostQuery($postArgs);
$templates = array( 'index.twig' );

if (is_post_type_archive('people')) {
    array_unshift($templates, 'index-grid.twig');
}

Timber::render($templates, $context);
