<?php
// Compiled by kit from sections/services/services.blade.php. Don't edit it: change the template and run `kit section compile`.
return function ($content = [], $variant = 'default'): void {
?>

<section class="kit-section-services" data-background="<?php echo kit_e($content['background']); ?>">
  <div class="kit-container">
    <div class="kit-section-head"<?php if (($variant === 'centred')): ?> data-align="centre"<?php endif; ?><?php echo kit_e(($content['rule'] ? ' data-rule' : '')); ?>>
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
    <ul class="kit-grid kit-services-grid" data-cols="<?php echo kit_e($content['columns']); ?>" data-min="sm" role="list">
      <?php foreach ($content['services'] as $service): ?>
      <li class="kit-card kit-service-card">
<?php if ($service['number']): ?>
        <p class="kit-service-number"><?php echo kit_e($service['number']); ?></p>
<?php endif; ?>
        <?php if ($service['icon']): ?>
        <span class="kit-service-icon"><?php echo kit_e(kit_icon($service['icon'])); ?></span>
        <?php endif; ?>
        <h3 class="kit-service-title"><?php echo kit_e($service['title']); ?><?php if ($service['subtitle']): ?> <span class="kit-service-subtitle"><?php echo kit_e(kit_rich($service['subtitle'])); ?></span><?php endif; ?></h3>
        <?php if ($service['text']): ?>
        <p class="kit-service-text"><?php echo kit_e($service['text']); ?></p>
        <?php endif; ?>
        <?php if ($service['proof']): ?>
        <p class="kit-service-proof"><?php echo kit_e(kit_icon('check')); ?><span><?php echo kit_e($service['proof']); ?></span></p>
        <?php endif; ?>
        <?php if (($service['link_label'] && $service['link_url'])): ?>
        <a class="kit-link kit-service-link" data-variant="arrow" href="<?php echo kit_e(kit_url($service['link_url'])); ?>"><?php echo kit_e($service['link_label']); ?><span class="kit-vh">: <?php echo kit_e($service['title']); ?></span></a>
        <?php endif; ?>
      </li>
      <?php endforeach; ?>
    </ul>
  </div>
</section>
<?php
};
