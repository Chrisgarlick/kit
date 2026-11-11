<?php
// Compiled by kit from sections/gallery/gallery.blade.php. Don't edit it: change the template and run `kit section compile`.
return function ($content = [], $variant = 'default'): void {
?>

<section class="kit-section-gallery" data-background="<?php echo kit_e($content['background']); ?>">
  <div class="kit-container">
    <div class="kit-section-head"<?php if (($variant === 'centred')): ?> data-align="centre"<?php endif; ?>>
      <div class="kit-section-head-text">
        <?php if ($content['eyebrow']): ?>
        <p class="kit-section-head-eyebrow"><?php echo kit_e($content['eyebrow']); ?></p>
        <?php endif; ?>
        <<?php echo kit_e(kit_heading($content['heading_level'])); ?> class="kit-section-head-title"><?php echo kit_e(kit_rich($content['title'])); ?></<?php echo kit_e(kit_heading($content['heading_level'])); ?>>
        <?php if ($content['lede']): ?>
        <p class="kit-section-head-lede"><?php echo kit_e(kit_rich($content['lede'])); ?></p>
        <?php endif; ?>
      </div>
      <?php if (($content['link_label'] && $content['link_url'])): ?>
      <a class="kit-link" data-variant="arrow" href="<?php echo kit_e(kit_url($content['link_url'])); ?>"><?php echo kit_e($content['link_label']); ?></a>
      <?php endif; ?>
    </div>
    <ul class="kit-grid kit-gallery-grid" data-cols="<?php echo kit_e($content['columns']); ?>" data-min="xs" role="list">
      <?php foreach ($content['images'] as $photo): ?>
      <li>
        <figure class="kit-gallery-item">
          <?php if ($photo['image']): ?>
          <img class="kit-gallery-media" src="<?php echo kit_e(kit_url($photo['image']['src'])); ?>" alt="<?php echo kit_e($photo['image']['alt']); ?>" <?php if (isset($photo['image']['width'])): ?>width="<?php echo kit_e($photo['image']['width']); ?>" height="<?php echo kit_e(($photo['image']['height'] ?? '')); ?>" <?php endif; ?> loading="lazy">
          <?php else: ?>
          <div class="kit-gallery-media" data-empty><?php echo kit_e(kit_icon('image')); ?></div>
          <?php endif; ?>
          <?php if ($photo['caption']): ?>
          <figcaption><?php echo kit_e($photo['caption']); ?></figcaption>
          <?php endif; ?>
        </figure>
      </li>
      <?php endforeach; ?>
    </ul>
  </div>
</section>
<?php
};
