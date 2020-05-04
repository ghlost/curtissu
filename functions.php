<?php
// Remove all default WP template redirects/lookups
remove_action( 'template_redirect', 'redirect_canonical' );

// Redirect all requests to index.php so the Vue app is loaded and 404s aren't thrown
function remove_redirects() {
  add_rewrite_rule( '^/(.+)/?', 'index.php', 'top' );
}
add_action( 'init', 'remove_redirects' );

// Load scripts
function load_vue_scripts() {
  wp_enqueue_script(
    'vuejs-wordpress-theme-starter-js',
    get_stylesheet_directory_uri() . '/dist/scripts/index.js',
    array( 'jquery' ),
    filemtime( get_stylesheet_directory() . '/dist/scripts/index.js' ),
    true
  );

  wp_enqueue_style(
    'vuejs-wordpress-theme-starter-css',
    get_stylesheet_directory_uri() . '/dist/styles.css',
    null,
    filemtime( get_stylesheet_directory() . '/dist/styles.css' )
  );
}
add_action( 'wp_enqueue_scripts', 'load_vue_scripts', 100 );
add_theme_support('menus');
add_theme_support('post-thumbnails');

add_action( 'rest_api_init', 'add_thumbnail_to_JSON' );
function add_thumbnail_to_JSON() {

  //Add featured image
  register_rest_field( 
    'post', // Where to add the field (Here, blog posts. Could be an array)
    'featured_image_src', // Name of new field (You can call this anything)
    array(
      'get_callback'    => 'get_image_src',
      'update_callback' => null,
      'schema'          => null,
    )
  );
}

function get_image_src( $object, $field_name, $request ) {
  $feat_img_array = wp_get_attachment_image_src(
    $object['featured_media'], // Image attachment ID
    'medium',  // Size.  Ex. "thumbnail", "large", "full", etc..
    true // Whether the image should be treated as an icon.
  );
  return $feat_img_array[0];
}
