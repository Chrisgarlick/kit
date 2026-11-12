<?php
// Compiled by kit from sections/marquee/marquee.blade.php. Don't edit it: change the template and run `kit section compile`.
return function ($content = [], $variant = 'default'): void {
?>

<section class="kit-section-marquee" data-tone="<?php echo kit_e($content['tone']); ?>" data-speed="<?php echo kit_e($content['speed']); ?>">
  <label class="kit-marquee-pause"><input type="checkbox"> Pause the moving text</label>
  <div class="kit-marquee">
    <div class="kit-marquee-track">
      <ul class="kit-marquee-run" role="list">
        <?php foreach ($content['phrases'] as $phrase): ?>
        <li><span class="kit-marquee-phrase"><?php echo kit_e(kit_rich($phrase['text'])); ?></span><span class="kit-marquee-sep" aria-hidden="true"><?php echo kit_e($content['separator']); ?></span></li>
        <?php endforeach; ?>
      </ul>
      <ul class="kit-marquee-run" role="list" aria-hidden="true">
        <?php foreach ($content['phrases'] as $phrase): ?>
        <li><span class="kit-marquee-phrase"><?php echo kit_e(kit_rich($phrase['text'])); ?></span><span class="kit-marquee-sep"><?php echo kit_e($content['separator']); ?></span></li>
        <?php endforeach; ?>
      </ul>
    </div>
  </div>
</section>
<?php
};
