<?php
// Compiled by kit from sections/header/header.blade.php. Don't edit it: change the template and run `kit section compile`.
return function ($content = [], $variant = 'default'): void {
?>

<header class="kit-section-header"<?php if (($content['tone'] !== 'plain')): ?> data-tone="<?php echo kit_e($content['tone']); ?>"<?php endif; ?>>
  <div class="kit-container kit-header-bar">
    <a class="kit-header-brand" href="<?php echo kit_e(kit_url($content['home_url'])); ?>">
      <?php if ($content['logo']): ?>
      <img class="kit-header-logo" src="<?php echo kit_e(kit_url($content['logo']['src'])); ?>" alt="" <?php if (isset($content['logo']['width'])): ?>width="<?php echo kit_e($content['logo']['width']); ?>" height="<?php echo kit_e(($content['logo']['height'] ?? '')); ?>"<?php endif; ?>>
      <?php else: ?>
      <span class="kit-header-mark" aria-hidden="true"></span>
      <?php endif; ?>
      <span class="kit-header-name"><?php echo kit_e($content['brand_name']); ?></span>
    </a>
    <?php if (count($content['links'])): ?>
    <nav class="kit-header-nav" aria-label="Main">
      <ul role="list">
        <?php foreach ($content['links'] as $i => $link): ?>
        <li><a href="<?php echo kit_e(kit_url($link['url'])); ?>"<?php if ($link['current']): ?> aria-current="page"<?php endif; ?>><?php if ($content['numbered']): ?><span class="kit-header-num" aria-hidden="true">0<?php echo kit_e(($i + 1)); ?></span><?php endif; ?><?php echo kit_e($link['label']); ?></a></li>
        <?php endforeach; ?>
      </ul>
    </nav>
    <?php endif; ?>
    <div class="kit-header-end">
      <?php if ($content['phone']): ?>
      <a class="kit-header-phone" href="<?php echo kit_e(kit_tel($content['phone'])); ?>"><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg><span><?php echo kit_e($content['phone']); ?></span></a>
      <?php endif; ?>
<?php if (($content['secondary_label'] && $content['secondary_url'])): ?>
      <a class="kit-header-secondary" href="<?php echo kit_e(kit_url($content['secondary_url'])); ?>"><?php echo kit_e($content['secondary_label']); ?></a>
<?php endif; ?>
      <?php if (($content['action_label'] && $content['action_url'])): ?>
      <a class="kit-button kit-header-action" data-variant="primary" href="<?php echo kit_e(kit_url($content['action_url'])); ?>"><?php echo kit_e($content['action_label']); ?></a>
      <?php endif; ?>
      <?php if (count($content['links'])): ?>
      <details class="kit-header-menu">
        <summary class="kit-button" data-variant="ghost"><svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="M4 7h16M4 12h16M4 17h16"/></svg><span>Menu</span></summary>
        <nav class="kit-header-sheet" aria-label="Menu">
          <ul role="list">
            <?php foreach ($content['links'] as $i => $link): ?>
            <li><a href="<?php echo kit_e(kit_url($link['url'])); ?>"<?php if ($link['current']): ?> aria-current="page"<?php endif; ?>><?php if ($content['numbered']): ?><span class="kit-header-num" aria-hidden="true">0<?php echo kit_e(($i + 1)); ?></span><?php endif; ?><?php echo kit_e($link['label']); ?></a></li>
            <?php endforeach; ?>
          </ul>
<?php if (($content['secondary_label'] && $content['secondary_url'])): ?>
          <a class="kit-header-secondary" href="<?php echo kit_e(kit_url($content['secondary_url'])); ?>"><?php echo kit_e($content['secondary_label']); ?></a>
<?php endif; ?>
          <?php if (($content['action_label'] && $content['action_url'])): ?>
          <a class="kit-button" data-variant="primary" href="<?php echo kit_e(kit_url($content['action_url'])); ?>"><?php echo kit_e($content['action_label']); ?></a>
          <?php endif; ?>
        </nav>
      </details>
      <?php endif; ?>
    </div>
  </div>
</header>
<?php
};
