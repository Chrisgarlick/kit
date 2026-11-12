<?php
// Compiled by kit from sections/footer/footer.blade.php. Don't edit it: change the template and run `kit section compile`.
return function ($content = [], $variant = 'default'): void {
?>

<footer class="kit-section-footer">
  <div class="kit-container">
    <div class="kit-footer-top">
      <div class="kit-footer-about">
        <p class="kit-footer-brand">
          <?php if ($content['logo']): ?>
          <img class="kit-footer-logo" src="<?php echo kit_e(kit_url($content['logo']['src'])); ?>" alt="" <?php if (isset($content['logo']['width'])): ?>width="<?php echo kit_e($content['logo']['width']); ?>" height="<?php echo kit_e(($content['logo']['height'] ?? '')); ?>"<?php endif; ?>>
          <?php else: ?>
          <span class="kit-footer-mark" aria-hidden="true"></span>
          <?php endif; ?>
          <span><?php echo kit_e($content['brand_name']); ?></span>
        </p>
        <?php if ($content['blurb']): ?>
        <p class="kit-footer-blurb"><?php echo kit_e($content['blurb']); ?></p>
        <?php endif; ?>
      </div>
      <?php foreach ($content['columns'] as $column): ?>
      <nav class="kit-footer-column" aria-label="<?php echo kit_e($column['heading']); ?>">
        <h2 class="kit-footer-heading"><?php echo kit_e($column['heading']); ?></h2>
        <ul role="list">
          <?php foreach ($column['links'] as $link): ?>
          <li><a href="<?php echo kit_e(kit_url($link['url'])); ?>"><?php echo kit_e($link['label']); ?></a></li>
          <?php endforeach; ?>
        </ul>
      </nav>
      <?php endforeach; ?>
      <?php if ((($content['phone'] || $content['email']) || count($content['social']))): ?>
      <div class="kit-footer-column">
        <h2 class="kit-footer-heading"><?php echo kit_e($content['contact_heading']); ?></h2>
        <ul role="list">
          <?php if ($content['phone']): ?>
          <li><a href="<?php echo kit_e(kit_tel($content['phone'])); ?>"><?php echo kit_e($content['phone']); ?></a></li>
          <?php endif; ?>
          <?php if ($content['email']): ?>
          <li><a href="<?php echo kit_e(kit_mailto($content['email'])); ?>"><?php echo kit_e($content['email']); ?></a></li>
          <?php endif; ?>
        </ul>
        <?php if (count($content['social'])): ?>
        <ul class="kit-footer-social" role="list">
          <?php foreach ($content['social'] as $profile): ?>
          <li>
            <a href="<?php echo kit_e(kit_url($profile['url'])); ?>" aria-label="<?php echo kit_e((($profile['network'] === 'instagram') ? 'Instagram' : (($profile['network'] === 'facebook') ? 'Facebook' : (($profile['network'] === 'linkedin') ? 'LinkedIn' : (($profile['network'] === 'tiktok') ? 'TikTok' : 'YouTube'))))); ?>">
              <?php if (($profile['network'] === 'instagram')): ?>
              <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/></svg>
              <?php elseif (($profile['network'] === 'facebook')): ?>
              <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              <?php elseif (($profile['network'] === 'linkedin')): ?>
              <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              <?php elseif (($profile['network'] === 'tiktok')): ?>
              <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="M9 12a4 4 0 1 0 4 4V2a5 5 0 0 0 5 5"/></svg>
              <?php else: ?>
              <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="M2.5 17a24 24 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24 24 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
              <?php endif; ?>
            </a>
          </li>
          <?php endforeach; ?>
        </ul>
        <?php endif; ?>
      </div>
      <?php endif; ?>
    </div>
    <div class="kit-footer-bottom">
      <?php if ($content['small_print']): ?>
      <p class="kit-footer-small"><?php echo kit_e($content['small_print']); ?></p>
      <?php endif; ?>
      <?php if (count($content['legal'])): ?>
      <ul class="kit-footer-legal" role="list">
        <?php foreach ($content['legal'] as $link): ?>
        <li><a href="<?php echo kit_e(kit_url($link['url'])); ?>"><?php echo kit_e($link['label']); ?></a></li>
        <?php endforeach; ?>
      </ul>
      <?php endif; ?>
    </div>
  </div>
<?php if ($content['wordmark']): ?>
  <p class="kit-footer-wordmark" aria-hidden="true"><?php echo kit_e($content['wordmark']); ?></p>
<?php endif; ?>
</footer>
<?php
};
