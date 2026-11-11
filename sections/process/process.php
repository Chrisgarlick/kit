<?php
// Compiled by kit from sections/process/process.blade.php. Don't edit it: change the template and run `kit section compile`.
return function ($content = [], $variant = 'default'): void {
?>

<section class="kit-section-process" data-background="<?php echo kit_e($content['background']); ?>">
  <div class="kit-container kit-process-inner">
    <div class="kit-process-text">
      <?php if ($content['eyebrow']): ?>
      <p class="kit-process-eyebrow"><?php echo kit_e($content['eyebrow']); ?></p>
      <?php endif; ?>
      <<?php echo kit_e(kit_heading($content['heading_level'])); ?> class="kit-process-title"><?php echo kit_e(kit_rich($content['title'])); ?></<?php echo kit_e(kit_heading($content['heading_level'])); ?>>
      <ol class="kit-process-steps">
        <?php foreach ($content['steps'] as $step): ?>
        <li><strong><?php echo kit_e($step['title']); ?>.</strong><?php if ($step['text']): ?> <?php echo kit_e($step['text']); ?><?php endif; ?></li>
        <?php endforeach; ?>
      </ol>
      <?php if (($content['link_label'] && $content['link_url'])): ?>
      <p class="kit-process-link"><a class="kit-link" data-variant="arrow" href="<?php echo kit_e(kit_url($content['link_url'])); ?>"><?php echo kit_e($content['link_label']); ?></a></p>
      <?php endif; ?>
    </div>
    <?php if (count($content['cards'])): ?>
    <ul class="kit-process-cards" role="list">
      <?php foreach ($content['cards'] as $card): ?>
      <li class="kit-note-card">
        <?php if ($card['label']): ?>
        <p class="kit-note-label"><?php echo kit_e($card['label']); ?></p>
        <?php endif; ?>
        <p class="kit-note-title"><?php echo kit_e($card['title']); ?></p>
        <?php if (count($card['points'])): ?>
        <ul class="kit-note-points" role="list">
          <?php foreach ($card['points'] as $point): ?>
          <li<?php echo kit_e(($point['included'] ? '' : ' data-left-out')); ?>><?php echo kit_e(kit_icon(($point['included'] ? 'check' : 'x'))); ?><span><span class="kit-vh"><?php echo kit_e(($point['included'] ? 'Included: ' : 'Not included: ')); ?></span><?php echo kit_e($point['text']); ?></span></li>
          <?php endforeach; ?>
        </ul>
        <?php endif; ?>
      </li>
      <?php endforeach; ?>
    </ul>
    <?php endif; ?>
  </div>
</section>
<?php
};
