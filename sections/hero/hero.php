<?php
// Compiled by kit from sections/hero/hero.blade.php. Don't edit it: change the template and run `kit section compile`.
return function ($content = [], $variant = 'default'): void {
?>

<section class="kit-section-hero" data-variant="<?php echo kit_e($variant); ?>"<?php if (($content['title_size'] !== 'normal')): ?> data-title-size="<?php echo kit_e($content['title_size']); ?>"<?php endif; ?>>
  <div class="kit-container kit-hero-inner">
    <div class="kit-hero-text">
      <?php if ($content['eyebrow']): ?>
      <p class="kit-hero-eyebrow"><?php if ($content['eyebrow_icon']): ?><?php echo kit_e(kit_icon($content['eyebrow_icon'])); ?><?php endif; ?><?php echo kit_e($content['eyebrow']); ?></p>
      <?php endif; ?>
      <<?php echo kit_e(kit_heading($content['heading_level'])); ?> class="kit-hero-title"><?php echo kit_e(kit_rich($content['title'])); ?></<?php echo kit_e(kit_heading($content['heading_level'])); ?>>
      <?php if ($content['lede']): ?>
      <p class="kit-hero-lede"><?php echo kit_e($content['lede']); ?></p>
      <?php endif; ?>
      <?php if (count($content['actions'])): ?>
      <div class="kit-hero-actions">
        <?php foreach ($content['actions'] as $i => $action): ?>
<?php if ((($i === 1) && ($content['secondary_style'] === 'link'))): ?>
        <a class="kit-link kit-hero-link" data-variant="arrow" href="<?php echo kit_e(kit_url($action['url'])); ?>"><?php echo kit_e($action['label']); ?></a>
<?php else: ?>
        <a class="kit-button" data-size="lg" data-variant="<?php echo kit_e($action['style']); ?>" href="<?php echo kit_e(kit_url($action['url'])); ?>"><?php echo kit_e($action['label']); ?></a>
<?php endif; ?>
        <?php endforeach; ?>
      </div>
      <?php endif; ?>
      <?php if ($content['proof']): ?>
      <p class="kit-hero-proof"><?php if (($content['proof_icon'] === 'star')): ?><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg><?php else: ?><?php echo kit_e(kit_icon($content['proof_icon'])); ?><?php endif; ?><span><?php echo kit_e(kit_rich($content['proof'])); ?></span></p>
      <?php endif; ?>
    </div>
    <?php if ((($variant !== 'text') && $content['image'])): ?>
<?php if ($content['caption']): ?>
    <figure class="kit-hero-figure">
      <img class="kit-hero-media" src="<?php echo kit_e(kit_url($content['image']['src'])); ?>" alt="<?php echo kit_e($content['image']['alt']); ?>" <?php if (isset($content['image']['width'])): ?>width="<?php echo kit_e($content['image']['width']); ?>" height="<?php echo kit_e(($content['image']['height'] ?? '')); ?>" <?php endif; ?> <?php if (isset($content['image']['srcset'])): ?>srcset="<?php echo kit_e($content['image']['srcset']); ?>" sizes="(min-width: 48rem) 50vw, 100vw" <?php endif; ?> fetchpriority="high">
      <figcaption class="kit-hero-caption"><?php echo kit_e($content['caption']); ?></figcaption>
    </figure>
<?php else: ?>
    <img class="kit-hero-media" src="<?php echo kit_e(kit_url($content['image']['src'])); ?>" alt="<?php echo kit_e($content['image']['alt']); ?>" <?php if (isset($content['image']['width'])): ?>width="<?php echo kit_e($content['image']['width']); ?>" height="<?php echo kit_e(($content['image']['height'] ?? '')); ?>" <?php endif; ?> <?php if (isset($content['image']['srcset'])): ?>srcset="<?php echo kit_e($content['image']['srcset']); ?>" sizes="(min-width: 48rem) 50vw, 100vw" <?php endif; ?> fetchpriority="high">
<?php endif; ?>
    <?php elseif (($variant !== 'text')): ?>
    <div class="kit-hero-media" data-empty><svg aria-hidden="true" viewBox="0 0 24 24" width="36" height="36"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg></div>
    <?php endif; ?>
  </div>
</section>
<?php
};
