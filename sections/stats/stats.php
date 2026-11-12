<?php
// Compiled by kit from sections/stats/stats.blade.php. Don't edit it: change the template and run `kit section compile`.
return function ($content = [], $variant = 'default'): void {
?>

<section class="kit-section-stats" data-tone="<?php echo kit_e($content['tone']); ?>">
  <div class="kit-container">
    <dl class="kit-stats-list">
      <?php foreach ($content['stats'] as $stat): ?>
      <div class="kit-stats-item">
        <dt><?php echo kit_e($stat['label']); ?></dt>
        <dd><?php echo kit_e($stat['value']); ?></dd>
<?php if (($stat['link_label'] && $stat['link_url'])): ?>
        <dd class="kit-stats-link"><a class="kit-link" data-variant="arrow" href="<?php echo kit_e(kit_url($stat['link_url'])); ?>"><?php echo kit_e($stat['link_label']); ?></a></dd>
<?php endif; ?>
      </div>
      <?php endforeach; ?>
    </dl>
  </div>
</section>
<?php
};
