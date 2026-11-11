<?php
// Compiled by kit from sections/quote-stats/quote-stats.blade.php. Don't edit it: change the template and run `kit section compile`.
return function ($content = [], $variant = 'default'): void {
?>

<section class="kit-section-quote-stats" data-background="<?php echo kit_e($content['background']); ?>">
  <div class="kit-container kit-qs-inner">
    <figure class="kit-qs-quote">
      <blockquote><p><?php echo kit_e(kit_rich($content['quote'])); ?></p></blockquote>
      <?php if ($content['attribution']): ?>
      <figcaption><?php echo kit_e($content['attribution']); ?></figcaption>
      <?php endif; ?>
    </figure>
    <?php if (count($content['stats'])): ?>
    <dl class="kit-qs-stats">
      <?php foreach ($content['stats'] as $stat): ?>
      <div class="kit-qs-stat">
        <dt><?php echo kit_e($stat['label']); ?></dt>
        <dd><?php echo kit_e($stat['value']); ?></dd>
      </div>
      <?php endforeach; ?>
    </dl>
    <?php endif; ?>
  </div>
</section>
<?php
};
