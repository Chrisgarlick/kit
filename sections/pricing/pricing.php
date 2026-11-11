<?php
// Compiled by kit from sections/pricing/pricing.blade.php. Don't edit it: change the template and run `kit section compile`.
return function ($content = [], $variant = 'default'): void {
?>

<section class="kit-section-pricing" data-background="<?php echo kit_e($content['background']); ?>">
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
    <ul class="kit-grid kit-pricing-grid" data-cols="<?php echo kit_e(count($content['plans'])); ?>" data-min="sm" role="list">
      <?php foreach ($content['plans'] as $plan): ?>
      <li class="kit-card kit-price-card"<?php echo kit_e(($plan['featured'] ? ' data-featured' : '')); ?>>
        <div class="kit-price-head">
          <h3 class="kit-price-name"><?php echo kit_e($plan['name']); ?></h3>
          <?php if (($plan['featured'] && $plan['badge'])): ?>
          <span class="kit-price-badge"><?php echo kit_e($plan['badge']); ?></span>
          <?php endif; ?>
        </div>
        <p class="kit-price-amount"><span class="kit-price-figure"><?php echo kit_e($plan['price']); ?></span><?php if ($plan['per']): ?><span class="kit-price-per"><?php echo kit_e($plan['per']); ?></span><?php endif; ?></p>
        <?php if ($plan['description']): ?>
        <p class="kit-price-desc"><?php echo kit_e($plan['description']); ?></p>
        <?php endif; ?>
        <?php if (count($plan['features'])): ?>
        <ul class="kit-price-features" role="list">
          <?php foreach ($plan['features'] as $feature): ?>
          <li><?php echo kit_e(kit_icon('check')); ?><span><?php echo kit_e($feature['text']); ?></span></li>
          <?php endforeach; ?>
        </ul>
        <?php endif; ?>
        <?php if (($plan['action_label'] && $plan['action_url'])): ?>
        <a class="kit-button kit-price-action" data-variant="<?php echo kit_e(($plan['featured'] ? 'primary' : 'secondary')); ?>" href="<?php echo kit_e(kit_url($plan['action_url'])); ?>"><?php echo kit_e($plan['action_label']); ?><span class="kit-vh">: <?php echo kit_e($plan['name']); ?></span></a>
        <?php endif; ?>
      </li>
      <?php endforeach; ?>
    </ul>
  </div>
</section>
<?php
};
