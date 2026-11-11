<?php
// Compiled by kit from sections/pill-row/pill-row.blade.php. Don't edit it: change the template and run `kit section compile`.
return function ($content = [], $variant = 'default'): void {
?>

<section class="kit-section-pill-row" data-background="<?php echo kit_e($content['background']); ?>">
  <div class="kit-container kit-pills-row">
    <?php if ($content['label']): ?>
    <p class="kit-pills-label"><?php echo kit_e($content['label']); ?></p>
    <?php endif; ?>
    <ul class="kit-pills" role="list">
      <?php foreach ($content['pills'] as $pill): ?>
      <?php if ($pill['url']): ?>
      <li><a class="kit-pill" href="<?php echo kit_e(kit_url($pill['url'])); ?>"><?php echo kit_e($pill['text']); ?></a></li>
      <?php else: ?>
      <li><span class="kit-pill"><?php echo kit_e($pill['text']); ?></span></li>
      <?php endif; ?>
      <?php endforeach; ?>
    </ul>
  </div>
</section>
<?php
};
