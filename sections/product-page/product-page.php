<?php
// Compiled by kit from sections/product-page/product-page.blade.php. Don't edit it: change the template and run `kit section compile`.
return function ($content = [], $variant = 'default'): void {
?>

<section class="kit-section-product-page">
  <div class="kit-container kit-pp-inner">
    <div class="kit-pp-gallery">
      <div class="kit-pp-slides" tabindex="0" role="region" aria-label="Photos">
        <?php foreach ($content['images'] as $i => $photo): ?>
        <figure class="kit-pp-slide" id="kit-product-photo-<?php echo kit_e(($i + 1)); ?>">
          <?php if ($photo['image']): ?>
          <img src="<?php echo kit_e(kit_url($photo['image']['src'])); ?>" alt="<?php echo kit_e($photo['image']['alt']); ?>" <?php if (isset($photo['image']['width'])): ?>width="<?php echo kit_e($photo['image']['width']); ?>" height="<?php echo kit_e(($photo['image']['height'] ?? '')); ?>" <?php endif; ?><?php echo kit_e((($i === 0) ? ' fetchpriority="high"' : ' loading="lazy"')); ?>>
          <?php else: ?>
          <span class="kit-pp-placeholder"><?php echo kit_e(kit_icon('box')); ?></span>
          <?php endif; ?>
        </figure>
        <?php endforeach; ?>
        <?php if (!(count($content['images']))): ?>
        <figure class="kit-pp-slide"><span class="kit-pp-placeholder"><?php echo kit_e(kit_icon('box')); ?></span></figure>
        <?php endif; ?>
      </div>
      <?php if (isset($content['images'][1])): ?>
      <ul class="kit-pp-thumbs" role="list">
        <?php foreach ($content['images'] as $i => $photo): ?>
        <li><a href="#kit-product-photo-<?php echo kit_e(($i + 1)); ?>"><?php if ($photo['image']): ?><img src="<?php echo kit_e(kit_url($photo['image']['src'])); ?>" alt="" loading="lazy"><?php else: ?><span class="kit-pp-placeholder"></span><?php endif; ?><span class="kit-vh">Photo <?php echo kit_e(($i + 1)); ?></span></a></li>
        <?php endforeach; ?>
      </ul>
      <?php endif; ?>
    </div>
    <div class="kit-pp-info">
      <?php if (count($content['crumbs'])): ?>
      <nav aria-label="Breadcrumb">
        <ol class="kit-breadcrumbs">
          <?php foreach ($content['crumbs'] as $i => $crumb): ?>
          <li><?php if (($i === (count($content['crumbs']) - 1))): ?><a href="<?php echo kit_e(kit_url($crumb['url'])); ?>" aria-current="page"><?php echo kit_e($crumb['label']); ?></a><?php else: ?><a href="<?php echo kit_e(kit_url($crumb['url'])); ?>"><?php echo kit_e($crumb['label']); ?></a><?php endif; ?></li>
          <?php endforeach; ?>
        </ol>
      </nav>
      <?php endif; ?>
      <<?php echo kit_e(kit_heading($content['heading_level'])); ?> class="kit-pp-name"><?php echo kit_e($content['name']); ?></<?php echo kit_e(kit_heading($content['heading_level'])); ?>>
      <?php if ($content['rating']): ?>
      <p class="kit-pp-rating"><?php echo kit_e(kit_icon('star')); ?><span><strong><?php echo kit_e($content['rating']); ?></strong><span class="kit-vh"> out of 5</span><?php if ($content['reviews_label']): ?> · <?php if ($content['reviews_url']): ?><a href="<?php echo kit_e(kit_url($content['reviews_url'])); ?>"><?php echo kit_e($content['reviews_label']); ?></a><?php else: ?><?php echo kit_e($content['reviews_label']); ?><?php endif; ?> <?php endif; ?></span></p>
      <?php endif; ?>
      <p class="kit-pp-price"><?php if ($content['was_price']): ?><span class="kit-pp-now"><span class="kit-vh">Now </span><?php echo kit_e($content['price']); ?></span> <s class="kit-pp-was"><span class="kit-vh">was </span><?php echo kit_e($content['was_price']); ?></s><?php else: ?><?php echo kit_e($content['price']); ?><?php endif; ?></p>
      <?php if ($content['description']): ?>
      <div class="kit-pp-description"><?php echo kit_e(kit_paragraphs($content['description'])); ?></div>
      <?php endif; ?>
      <form class="kit-pp-buy" method="post" action="<?php echo kit_e(kit_url($content['form_action'])); ?>">
        <?php if ($content['product_id']): ?>
        <input type="hidden" name="product" value="<?php echo kit_e($content['product_id']); ?>">
        <?php endif; ?>
        <?php foreach ($content['options'] as $option): ?>
        <fieldset class="kit-pp-option" data-kind="<?php echo kit_e($option['kind']); ?>">
          <legend><?php echo kit_e($option['name']); ?></legend>
          <div class="kit-pp-choices">
            <?php foreach ($option['values'] as $value): ?>
            <label class="kit-pp-choice">
              <input type="radio" name="options[<?php echo kit_e($option['name']); ?>]" value="<?php echo kit_e($value['label']); ?>"<?php echo kit_e(($value['selected'] ? ' checked' : '')); ?><?php echo kit_e(($value['unavailable'] ? ' disabled' : '')); ?>>
              <?php if (($option['kind'] === 'swatches')): ?>
              <svg class="kit-pp-swatch" viewBox="0 0 36 36" width="36" height="36" aria-hidden="true"><circle cx="18" cy="18" r="17.5" fill="<?php echo kit_e(kit_colour($value['colour'])); ?>"/></svg>
              <?php endif; ?>
              <span class="<?php echo kit_e((($option['kind'] === 'swatches') ? 'kit-vh' : 'kit-pp-choice-label')); ?>"><?php echo kit_e($value['label']); ?><?php if ($value['unavailable']): ?> (out of stock)<?php endif; ?></span>
            </label>
            <?php endforeach; ?>
          </div>
        </fieldset>
        <?php endforeach; ?>
        <div class="kit-pp-actions">
          <?php if (($content['quantity'] && !($content['sold_out']))): ?>
          <div class="kit-field kit-pp-qty">
            <label class="kit-vh" for="kit-pp-qty">Quantity</label>
            <input class="kit-input" id="kit-pp-qty" type="number" name="quantity" value="1" min="1" max="99" inputmode="numeric">
          </div>
          <?php endif; ?>
          <?php if ($content['sold_out']): ?>
          <button class="kit-button kit-pp-add" data-variant="secondary" data-size="lg" type="submit" disabled>Sold out</button>
          <?php else: ?>
          <button class="kit-button kit-pp-add" data-variant="primary" data-size="lg" type="submit"><?php echo kit_e(kit_icon('bag')); ?><?php echo kit_e($content['add_label']); ?></button>
          <?php endif; ?>
        </div>
      </form>
      <?php if (count($content['perks'])): ?>
      <ul class="kit-pp-perks" role="list">
        <?php foreach ($content['perks'] as $perk): ?>
        <li><?php echo kit_e(kit_icon($perk['icon'])); ?><span><?php echo kit_e($perk['text']); ?></span></li>
        <?php endforeach; ?>
      </ul>
      <?php endif; ?>
      <?php if (count($content['details'])): ?>
      <div class="kit-pp-details">
        <?php foreach ($content['details'] as $detail): ?>
        <details class="kit-accordion">
          <summary><?php echo kit_e($detail['title']); ?></summary>
          <div class="kit-accordion-body"><?php echo kit_e(kit_paragraphs($detail['body'])); ?></div>
        </details>
        <?php endforeach; ?>
      </div>
      <?php endif; ?>
    </div>
  </div>
</section>
<?php
};
