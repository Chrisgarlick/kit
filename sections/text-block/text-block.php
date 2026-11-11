<?php
// Compiled by kit from sections/text-block/text-block.blade.php. Don't edit it: change the template and run `kit section compile`.
return function ($content = [], $variant = 'default'): void {
?>

<section class="kit-section-text-block" data-background="<?php echo kit_e($content['background']); ?>">
  <div class="kit-container">
    <div class="kit-text-block"<?php if (($variant === 'centred')): ?> data-align="centre"<?php endif; ?>>
      <?php if ($content['eyebrow']): ?>
      <p class="kit-text-block-eyebrow"><?php echo kit_e($content['eyebrow']); ?></p>
      <?php endif; ?>
      <<?php echo kit_e(kit_heading($content['heading_level'])); ?> class="kit-text-block-title"><?php echo kit_e(kit_rich($content['title'])); ?></<?php echo kit_e(kit_heading($content['heading_level'])); ?>>
      <?php if ($content['body']): ?>
      <div class="kit-text-block-body"><?php echo kit_e(kit_paragraphs($content['body'])); ?></div>
      <?php endif; ?>
      <?php if (count($content['points'])): ?>
      <ul class="kit-text-block-points" role="list">
        <?php foreach ($content['points'] as $point): ?>
        <li><?php echo kit_e($point['text']); ?></li>
        <?php endforeach; ?>
      </ul>
      <?php endif; ?>
      <?php if (($content['link_label'] && $content['link_url'])): ?>
      <p class="kit-text-block-actions"><a class="kit-link" data-variant="arrow" href="<?php echo kit_e(kit_url($content['link_url'])); ?>"><?php echo kit_e($content['link_label']); ?></a></p>
      <?php endif; ?>
    </div>
  </div>
</section>
<?php
};
