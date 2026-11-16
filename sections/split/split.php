<?php
// Compiled by kit from sections/split/split.blade.php. Don't edit it: change the template and run `kit section compile`.
return function ($content = [], $variant = 'default'): void {
?>

<section class="kit-section-split" data-background="<?php echo kit_e($content['background']); ?>" data-media="<?php echo kit_e($content['media']); ?>"<?php echo kit_e(($content['swap'] ? ' data-swap' : '')); ?><?php echo kit_e(((($content['frame'] === 'browser') && ($content['media'] === 'image')) ? ' data-frame' : '')); ?><?php if (($content['panel'] !== 'none')): ?> data-panel="<?php echo kit_e($content['panel']); ?>"<?php endif; ?>>
  <div class="kit-container kit-split-inner">
    <div class="kit-text-block kit-split-text">
      <?php if ($content['eyebrow']): ?>
      <p class="kit-text-block-eyebrow"><?php echo kit_e($content['eyebrow']); ?></p>
      <?php endif; ?>
      <<?php echo kit_e(kit_heading($content['heading_level'])); ?> class="kit-text-block-title"><?php echo kit_e(kit_rich($content['title'])); ?></<?php echo kit_e(kit_heading($content['heading_level'])); ?>>
      <?php if ($content['body']): ?>
      <div class="kit-text-block-body"><?php echo kit_e(kit_paragraphs($content['body'])); ?></div>
      <?php endif; ?>
      <?php if (count($content['points'])): ?>
      <ul class="kit-text-block-points" role="list">
        <?php foreach ($content['points'] as $point): ?>
        <li<?php echo kit_e(($point['excluded'] ? ' data-excluded' : '')); ?>><?php if ($point['excluded']): ?><span class="kit-vh">Not included: </span><?php endif; ?><?php echo kit_e($point['text']); ?></li>
        <?php endforeach; ?>
      </ul>
      <?php endif; ?>
      <?php if (($content['link_label'] && $content['link_url'])): ?>
      <p class="kit-text-block-actions"><a class="kit-link" data-variant="arrow" href="<?php echo kit_e(kit_url($content['link_url'])); ?>"><?php echo kit_e($content['link_label']); ?></a></p>
      <?php endif; ?>
    </div>
    <?php if (($content['media'] === 'questions')): ?>
    <div class="kit-split-questions">
      <?php foreach ($content['questions'] as $i => $item): ?>
      <details class="kit-accordion"<?php echo kit_e((($i === 0) ? ' open' : '')); ?>>
<?php if ($content['numbered']): ?>
        <summary><span class="kit-split-number" aria-hidden="true"><?php echo kit_e((((($i === 9) || ($i === 10)) || ($i === 11)) ? '' : '0')); ?><?php echo kit_e(($i + 1)); ?></span><span class="kit-split-question"><?php echo kit_e($item['question']); ?></span></summary>
<?php else: ?>
        <summary><?php echo kit_e($item['question']); ?></summary>
<?php endif; ?>
        <div class="kit-accordion-body"><?php echo kit_e(kit_paragraphs($item['answer'])); ?></div>
      </details>
      <?php endforeach; ?>
    </div>
    <?php elseif (($content['media'] === 'card')): ?>
    <div class="kit-split-card">
<?php if ($content['card_label']): ?>
      <p class="kit-split-card-label"><?php echo kit_e($content['card_label']); ?></p>
<?php endif; ?>
<?php if ($content['card_title']): ?>
      <p class="kit-split-card-title"><?php echo kit_e(kit_rich($content['card_title'])); ?></p>
<?php endif; ?>
<?php if ($content['card_text']): ?>
      <p class="kit-split-card-text"><?php echo kit_e($content['card_text']); ?></p>
<?php endif; ?>
    </div>
    <?php elseif ($content['image']): ?>
<?php if ($content['caption']): ?>
    <figure class="kit-split-figure">
<?php if (($content['frame'] === 'browser')): ?>
      <div class="kit-split-window" data-frame="browser">
        <div class="kit-split-bar" aria-hidden="true"><?php if ($content['frame_url']): ?><span class="kit-split-url"><?php echo kit_e($content['frame_url']); ?></span><?php endif; ?></div>
<?php endif; ?>
      <img class="kit-split-media" src="<?php echo kit_e(kit_url($content['image']['src'])); ?>" alt="<?php echo kit_e($content['image']['alt']); ?>" <?php if (isset($content['image']['width'])): ?>width="<?php echo kit_e($content['image']['width']); ?>" height="<?php echo kit_e(($content['image']['height'] ?? '')); ?>" <?php endif; ?> <?php if (isset($content['image']['srcset'])): ?>srcset="<?php echo kit_e($content['image']['srcset']); ?>" sizes="(min-width: 48rem) 50vw, 100vw" <?php endif; ?> loading="lazy">
<?php if (($content['frame'] === 'browser')): ?>
      </div>
<?php endif; ?>
      <figcaption class="kit-split-caption"><?php echo kit_e($content['caption']); ?></figcaption>
    </figure>
<?php else: ?>
<?php if (($content['frame'] === 'browser')): ?>
    <div class="kit-split-window" data-frame="browser">
      <div class="kit-split-bar" aria-hidden="true"><?php if ($content['frame_url']): ?><span class="kit-split-url"><?php echo kit_e($content['frame_url']); ?></span><?php endif; ?></div>
<?php endif; ?>
    <img class="kit-split-media" src="<?php echo kit_e(kit_url($content['image']['src'])); ?>" alt="<?php echo kit_e($content['image']['alt']); ?>" <?php if (isset($content['image']['width'])): ?>width="<?php echo kit_e($content['image']['width']); ?>" height="<?php echo kit_e(($content['image']['height'] ?? '')); ?>" <?php endif; ?> <?php if (isset($content['image']['srcset'])): ?>srcset="<?php echo kit_e($content['image']['srcset']); ?>" sizes="(min-width: 48rem) 50vw, 100vw" <?php endif; ?> loading="lazy">
<?php if (($content['frame'] === 'browser')): ?>
    </div>
<?php endif; ?>
<?php endif; ?>
    <?php else: ?>
<?php if ($content['caption']): ?>
    <figure class="kit-split-figure">
<?php if (($content['frame'] === 'browser')): ?>
      <div class="kit-split-window" data-frame="browser">
        <div class="kit-split-bar" aria-hidden="true"><?php if ($content['frame_url']): ?><span class="kit-split-url"><?php echo kit_e($content['frame_url']); ?></span><?php endif; ?></div>
<?php endif; ?>
      <div class="kit-split-media" data-empty><svg aria-hidden="true" viewBox="0 0 24 24" width="36" height="36"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg></div>
<?php if (($content['frame'] === 'browser')): ?>
      </div>
<?php endif; ?>
      <figcaption class="kit-split-caption"><?php echo kit_e($content['caption']); ?></figcaption>
    </figure>
<?php else: ?>
<?php if (($content['frame'] === 'browser')): ?>
    <div class="kit-split-window" data-frame="browser">
      <div class="kit-split-bar" aria-hidden="true"><?php if ($content['frame_url']): ?><span class="kit-split-url"><?php echo kit_e($content['frame_url']); ?></span><?php endif; ?></div>
<?php endif; ?>
    <div class="kit-split-media" data-empty><svg aria-hidden="true" viewBox="0 0 24 24" width="36" height="36"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg></div>
<?php if (($content['frame'] === 'browser')): ?>
    </div>
<?php endif; ?>
<?php endif; ?>
    <?php endif; ?>
  </div>
</section>
<?php
};
