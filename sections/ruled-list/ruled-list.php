<?php
// Compiled by kit from sections/ruled-list/ruled-list.blade.php. Don't edit it: change the template and run `kit section compile`.
return function ($content = [], $variant = 'default'): void {
?>

<section class="kit-section-ruled-list" data-tone="<?php echo kit_e($content['tone']); ?>">
  <div class="kit-container">
    <?php if ((($content['eyebrow'] || $content['title']) || $content['lede'])): ?>
    <div class="kit-section-head">
      <div class="kit-section-head-text">
        <?php if ($content['eyebrow']): ?>
        <p class="kit-section-head-eyebrow"><?php echo kit_e($content['eyebrow']); ?></p>
        <?php endif; ?>
        <?php if ($content['title']): ?>
        <<?php echo kit_e(kit_heading($content['heading_level'])); ?> class="kit-section-head-title"><?php echo kit_e(kit_rich($content['title'])); ?></<?php echo kit_e(kit_heading($content['heading_level'])); ?>>
        <?php endif; ?>
        <?php if ($content['lede']): ?>
        <p class="kit-section-head-lede"><?php echo kit_e(kit_rich($content['lede'])); ?></p>
        <?php endif; ?>
      </div>
    </div>
    <?php endif; ?>
    <ol class="kit-ruled-list" role="list">
      <?php foreach ($content['rows'] as $row): ?>
      <li class="kit-ruled-row">
        <?php if ($row['number']): ?>
        <span class="kit-ruled-num"><?php echo kit_e($row['number']); ?></span>
        <?php else: ?>
        <span class="kit-ruled-num" data-auto aria-hidden="true"></span>
        <?php endif; ?>
        <?php if ($row['url']): ?>
        <p class="kit-ruled-name"><a href="<?php echo kit_e(kit_url($row['url'])); ?>"><?php echo kit_e(kit_rich($row['name'])); ?></a></p>
        <?php else: ?>
        <p class="kit-ruled-name"><?php echo kit_e(kit_rich($row['name'])); ?></p>
        <?php endif; ?>
        <?php if ($row['value']): ?>
        <p class="kit-ruled-value"><?php echo kit_e($row['value']); ?></p>
        <?php endif; ?>
        <?php if ($row['text']): ?>
        <p class="kit-ruled-text"><?php echo kit_e($row['text']); ?></p>
        <?php endif; ?>
      </li>
      <?php endforeach; ?>
    </ol>
  </div>
</section>
<?php
};
