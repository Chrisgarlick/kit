<?php
// Compiled by kit from sections/figure/figure.blade.php. Don't edit it: change the template and run `kit section compile`.
return function ($content = [], $variant = 'default'): void {
?>

<section class="kit-section-figure" data-tone="<?php echo kit_e($content['tone']); ?>">
  <div class="kit-container">
    <figure class="kit-figure">
      <div class="kit-figure-frame">
<?php if (($content['frame'] === 'browser')): ?>
        <div class="kit-figure-window" data-frame="browser">
          <div class="kit-figure-bar" aria-hidden="true"><?php if ($content['frame_url']): ?><span class="kit-figure-url"><?php echo kit_e($content['frame_url']); ?></span><?php endif; ?></div>
<?php endif; ?>
<?php if ($content['image']): ?>
        <img class="kit-figure-media" src="<?php echo kit_e(kit_url($content['image']['src'])); ?>" alt="<?php echo kit_e($content['image']['alt']); ?>" <?php if (isset($content['image']['width'])): ?>width="<?php echo kit_e($content['image']['width']); ?>" height="<?php echo kit_e(($content['image']['height'] ?? '')); ?>" <?php endif; ?> <?php if (isset($content['image']['srcset'])): ?>srcset="<?php echo kit_e($content['image']['srcset']); ?>" sizes="100vw" <?php endif; ?> loading="lazy">
<?php else: ?>
        <div class="kit-figure-media" data-empty><?php echo kit_e(kit_icon('image')); ?></div>
<?php endif; ?>
<?php if (($content['frame'] === 'browser')): ?>
        </div>
<?php endif; ?>
<?php if ($content['proof_value']): ?>
        <div class="kit-figure-proof">
<?php if ($content['proof_label']): ?>
          <p class="kit-figure-proof-label"><?php echo kit_e($content['proof_label']); ?></p>
<?php endif; ?>
          <p class="kit-figure-proof-value"><?php echo kit_e($content['proof_value']); ?></p>
<?php if ($content['proof_note']): ?>
          <p class="kit-figure-proof-note"><?php echo kit_e($content['proof_note']); ?></p>
<?php endif; ?>
        </div>
<?php endif; ?>
      </div>
<?php if (($content['caption_left'] || $content['caption_right'])): ?>
      <figcaption class="kit-figure-caption">
<?php if ($content['caption_left']): ?>
        <span class="kit-figure-caption-left"><?php echo kit_e($content['caption_left']); ?></span>
<?php endif; ?>
<?php if ($content['caption_right']): ?>
        <span class="kit-figure-caption-right"><?php echo kit_e($content['caption_right']); ?></span>
<?php endif; ?>
      </figcaption>
<?php endif; ?>
    </figure>
  </div>
</section>
<?php
};
