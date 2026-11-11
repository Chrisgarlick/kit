<?php
// Compiled by kit from sections/hero/hero.blade.php. Don't edit it: change the template and run `kit section compile`.
return function ($content = [], $variant = 'default'): void {
?>

<section class="kit-section-hero" data-variant="<?php echo kit_e($variant); ?>">
  <div class="kit-container kit-hero-inner">
    <div class="kit-hero-text">
      <?php if ($content['eyebrow']): ?>
      <p class="kit-hero-eyebrow"><?php echo kit_e($content['eyebrow']); ?></p>
      <?php endif; ?>
      <?php if (($content['heading_level'] === 1)): ?>
      <h1 class="kit-hero-title"><?php echo kit_e(kit_rich($content['title'])); ?></h1>
      <?php elseif (($content['heading_level'] === 2)): ?>
      <h2 class="kit-hero-title"><?php echo kit_e(kit_rich($content['title'])); ?></h2>
      <?php elseif (($content['heading_level'] === 3)): ?>
      <h3 class="kit-hero-title"><?php echo kit_e(kit_rich($content['title'])); ?></h3>
      <?php else: ?>
      <h4 class="kit-hero-title"><?php echo kit_e(kit_rich($content['title'])); ?></h4>
      <?php endif; ?>
      <?php if ($content['lede']): ?>
      <p class="kit-hero-lede"><?php echo kit_e($content['lede']); ?></p>
      <?php endif; ?>
      <?php if (count($content['actions'])): ?>
      <div class="kit-hero-actions">
        <?php foreach ($content['actions'] as $action): ?>
        <a class="kit-button" data-size="lg" data-variant="<?php echo kit_e($action['style']); ?>" href="<?php echo kit_e(kit_url($action['url'])); ?>"><?php echo kit_e($action['label']); ?></a>
        <?php endforeach; ?>
      </div>
      <?php endif; ?>
      <?php if ($content['proof']): ?>
      <p class="kit-hero-proof"><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg><span><?php echo kit_e(kit_rich($content['proof'])); ?></span></p>
      <?php endif; ?>
    </div>
    <?php if ($content['image']): ?>
    <img class="kit-hero-media" src="<?php echo kit_e(kit_url($content['image']['src'])); ?>" alt="<?php echo kit_e($content['image']['alt']); ?>" <?php if (isset($content['image']['width'])): ?>width="<?php echo kit_e($content['image']['width']); ?>" height="<?php echo kit_e(($content['image']['height'] ?? '')); ?>" <?php endif; ?> fetchpriority="high">
    <?php else: ?>
    <div class="kit-hero-media" data-empty><svg aria-hidden="true" viewBox="0 0 24 24" width="36" height="36"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg></div>
    <?php endif; ?>
  </div>
</section>
<?php
};
