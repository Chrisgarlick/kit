<?php
// Compiled by kit from sections/announcement-bar/announcement-bar.blade.php. Don't edit it: change the template and run `kit section compile`.
return function ($content = [], $variant = 'default'): void {
?>

<aside class="kit-section-announcement-bar" data-tone="<?php echo kit_e($content['tone']); ?>" aria-label="Notice">
  <p class="kit-container kit-announce-inner">
    <?php if ($content['icon']): ?>
    <?php echo kit_e(kit_icon($content['icon'])); ?>

    <?php endif; ?>
    <span><?php echo kit_e($content['text']); ?></span>
    <?php if (($content['link_label'] && $content['link_url'])): ?>
    <a href="<?php echo kit_e(kit_url($content['link_url'])); ?>"><?php echo kit_e($content['link_label']); ?></a>
    <?php endif; ?>
  </p>
</aside>
<?php
};
