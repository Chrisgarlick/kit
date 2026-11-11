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
      </div>
      <?php endforeach; ?>
    </dl>
  </div>
</section>
<?php
};
