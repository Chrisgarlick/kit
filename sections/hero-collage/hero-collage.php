<?php
// Compiled by kit from sections/hero-collage/hero-collage.blade.php. Don't edit it: change the template and run `kit section compile`.
return function ($content = [], $variant = 'default'): void {
?>

<section class="kit-section-hero-collage">
  <div class="kit-container kit-collage-inner">
    <div class="kit-collage-text">
      <?php if ($content['eyebrow']): ?>
      <p class="kit-collage-eyebrow"><?php echo kit_e($content['eyebrow']); ?></p>
      <?php endif; ?>
      <<?php echo kit_e(kit_heading($content['heading_level'])); ?> class="kit-collage-title"><?php echo kit_e(kit_rich($content['title'])); ?></<?php echo kit_e(kit_heading($content['heading_level'])); ?>>
      <?php if ($content['lede']): ?>
      <p class="kit-collage-lede"><?php echo kit_e($content['lede']); ?></p>
      <?php endif; ?>
      <?php if (count($content['actions'])): ?>
      <div class="kit-collage-actions">
        <?php foreach ($content['actions'] as $action): ?>
        <a class="kit-button" data-size="lg" data-variant="<?php echo kit_e($action['style']); ?>" href="<?php echo kit_e(kit_url($action['url'])); ?>"><?php echo kit_e($action['label']); ?></a>
        <?php endforeach; ?>
      </div>
      <?php endif; ?>
    </div>
    <?php if (count($content['cards'])): ?>
    <ul class="kit-collage-cards" role="list">
      <?php foreach ($content['cards'] as $i => $card): ?>
      <li class="kit-float-card" data-kind="<?php echo kit_e($card['kind']); ?>" data-slot="<?php echo kit_e($i); ?>">
        <?php if (($card['kind'] === 'score')): ?>
        <svg class="kit-float-ring" viewBox="0 0 36 36" width="72" height="72" aria-hidden="true"><circle cx="18" cy="18" r="15.5" pathLength="100"/><circle cx="18" cy="18" r="15.5" pathLength="100" stroke-dasharray="<?php echo kit_e(($card['score'] ?? 0)); ?> 100"/></svg>
        <div class="kit-float-score">
          <p class="kit-float-number"><?php echo kit_e(($card['score'] ?? 0)); ?><span class="kit-vh"> out of 100</span></p>
          <div>
            <?php if ($card['label']): ?>
            <p class="kit-float-title"><?php echo kit_e($card['label']); ?></p>
            <?php endif; ?>
            <?php if ($card['text']): ?>
            <p class="kit-float-text"><?php echo kit_e($card['text']); ?></p>
            <?php endif; ?>
          </div>
        </div>
        <?php elseif (($card['kind'] === 'photo')): ?>
        <?php if ($card['image']): ?>
        <img class="kit-float-photo" src="<?php echo kit_e(kit_url($card['image']['src'])); ?>" alt="<?php echo kit_e($card['image']['alt']); ?>" <?php if (isset($card['image']['width'])): ?>width="<?php echo kit_e($card['image']['width']); ?>" height="<?php echo kit_e(($card['image']['height'] ?? '')); ?>" <?php endif; ?> loading="lazy">
        <?php else: ?>
        <div class="kit-float-photo" data-empty><?php echo kit_e(kit_icon('image')); ?></div>
        <?php endif; ?>
        <?php if ($card['label']): ?>
        <p class="kit-float-text"><?php echo kit_e($card['label']); ?></p>
        <?php endif; ?>
        <?php else: ?>
        <?php if ($card['label']): ?>
        <p class="kit-float-label"><?php echo kit_e($card['label']); ?></p>
        <?php endif; ?>
        <?php if ($card['value']): ?>
        <p class="<?php echo kit_e((($card['kind'] === 'note') ? 'kit-float-title' : 'kit-float-value')); ?>"><?php echo kit_e($card['value']); ?></p>
        <?php endif; ?>
        <?php if ($card['text']): ?>
        <p class="kit-float-text"><?php echo kit_e($card['text']); ?></p>
        <?php endif; ?>
        <?php endif; ?>
      </li>
      <?php endforeach; ?>
    </ul>
    <?php endif; ?>
  </div>
</section>
<?php
};
