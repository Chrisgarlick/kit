<?php
// Compiled by kit from sections/cta/cta.blade.php. Don't edit it: change the template and run `kit section compile`.
return function ($content = [], $variant = 'default'): void {
?>

<section class="kit-section-cta">
  <div class="kit-container">
    <div class="kit-cta-band">
      <div class="kit-cta-text">
<?php if ($content['eyebrow']): ?>
        <p class="kit-cta-eyebrow"><?php echo kit_e($content['eyebrow']); ?></p>
<?php endif; ?>
        <<?php echo kit_e(kit_heading($content['heading_level'])); ?> class="kit-cta-title"><?php echo kit_e(kit_rich($content['title'])); ?></<?php echo kit_e(kit_heading($content['heading_level'])); ?>>
        <?php if ($content['lede']): ?>
        <p class="kit-cta-lede"><?php echo kit_e($content['lede']); ?></p>
        <?php endif; ?>
      </div>
      <?php if ((($content['action_label'] && $content['action_url']) || $content['phone'])): ?>
      <div class="kit-cta-actions">
        <?php if (($content['action_label'] && $content['action_url'])): ?>
        <a class="kit-button" data-size="lg" href="<?php echo kit_e(kit_url($content['action_url'])); ?>"><?php echo kit_e($content['action_label']); ?></a>
        <?php endif; ?>
        <?php if ($content['phone']): ?>
        <a class="kit-cta-phone" href="<?php echo kit_e(kit_tel($content['phone'])); ?>"><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg><span><?php echo kit_e($content['phone']); ?></span></a>
        <?php endif; ?>
      </div>
      <?php endif; ?>
    </div>
  </div>
</section>
<?php
};
