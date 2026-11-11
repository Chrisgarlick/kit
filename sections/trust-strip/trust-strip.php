<?php
// Compiled by kit from sections/trust-strip/trust-strip.blade.php. Don't edit it: change the template and run `kit section compile`.
return function ($content = [], $variant = 'default'): void {
?>

<section class="kit-section-trust-strip" data-background="<?php echo kit_e($content['background']); ?>">
  <div class="kit-container kit-trust-row">
    <?php if ($content['label']): ?>
    <p class="kit-trust-label"><?php echo kit_e($content['label']); ?></p>
    <?php endif; ?>
    <ul class="kit-trust-logos" role="list">
      <?php foreach ($content['logos'] as $logo): ?>
      <li>
        <?php if ($logo['url']): ?>
        <a class="kit-trust-logo" href="<?php echo kit_e(kit_url($logo['url'])); ?>">
        <?php else: ?>
        <span class="kit-trust-logo">
        <?php endif; ?>
          <?php if ($logo['image']): ?>
          <img src="<?php echo kit_e(kit_url($logo['image']['src'])); ?>" alt="<?php echo kit_e($logo['name']); ?>" <?php if (isset($logo['image']['width'])): ?>width="<?php echo kit_e($logo['image']['width']); ?>" height="<?php echo kit_e(($logo['image']['height'] ?? '')); ?>" <?php endif; ?> loading="lazy">
          <?php else: ?>
          <span class="kit-trust-name"><?php echo kit_e($logo['name']); ?></span>
          <?php endif; ?>
        <?php if ($logo['url']): ?>
        </a>
        <?php else: ?>
        </span>
        <?php endif; ?>
      </li>
      <?php endforeach; ?>
    </ul>
  </div>
</section>
<?php
};
