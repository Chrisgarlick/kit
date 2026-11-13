<?php
// Compiled by kit from sections/product-grid/product-grid.blade.php. Don't edit it: change the template and run `kit section compile`.
return function ($content = [], $variant = 'default'): void {
?>

<section class="kit-section-product-grid"<?php if (($content['background'] !== 'plain')): ?> data-background="<?php echo kit_e($content['background']); ?>"<?php endif; ?>>
  <div class="kit-container">
    <div class="kit-shop-head">
      <div class="kit-shop-title">
        <?php if (count($content['crumbs'])): ?>
        <nav aria-label="Breadcrumb">
          <ol class="kit-breadcrumbs">
            <?php foreach ($content['crumbs'] as $i => $crumb): ?>
            <li><?php if (($i === (count($content['crumbs']) - 1))): ?><a href="<?php echo kit_e(kit_url($crumb['url'])); ?>" aria-current="page"><?php echo kit_e($crumb['label']); ?></a><?php else: ?><a href="<?php echo kit_e(kit_url($crumb['url'])); ?>"><?php echo kit_e($crumb['label']); ?></a><?php endif; ?></li>
            <?php endforeach; ?>
          </ol>
        </nav>
        <?php endif; ?>
        <<?php echo kit_e(kit_heading($content['heading_level'])); ?> class="kit-shop-heading"><?php echo kit_e(kit_rich($content['title'])); ?></<?php echo kit_e(kit_heading($content['heading_level'])); ?>>
      </div>
      <?php if ($content['count']): ?>
      <p class="kit-shop-count"><?php echo kit_e($content['count']); ?></p>
      <?php endif; ?>
      <?php if (($content['link_label'] && $content['link_url'])): ?>
      <a class="kit-link" data-variant="arrow" href="<?php echo kit_e(kit_url($content['link_url'])); ?>"><?php echo kit_e($content['link_label']); ?></a>
      <?php endif; ?>
    </div>
    <?php if ((count($content['categories']) || count($content['sort_options']))): ?>
    <div class="kit-shop-tools">
      <?php if (count($content['categories'])): ?>
      <nav class="kit-shop-filters" aria-label="Categories">
        <ul role="list">
          <?php foreach ($content['categories'] as $category): ?>
          <li><a class="kit-shop-filter" href="<?php echo kit_e(kit_url($category['url'])); ?>"<?php echo kit_e(($category['current'] ? ' aria-current="page"' : '')); ?>><?php echo kit_e($category['label']); ?></a></li>
          <?php endforeach; ?>
        </ul>
      </nav>
      <?php endif; ?>
      <?php if (count($content['sort_options'])): ?>
      <form class="kit-shop-sort" method="get" action="<?php echo kit_e(kit_url($content['sort_url'])); ?>">
        <label class="kit-vh" for="kit-shop-sort">Sort by</label>
        <select class="kit-select" id="kit-shop-sort" name="<?php echo kit_e($content['sort_name']); ?>">
          <?php foreach ($content['sort_options'] as $option): ?>
          <option value="<?php echo kit_e($option['value']); ?>"<?php echo kit_e(($option['current'] ? ' selected' : '')); ?>>Sort: <?php echo kit_e($option['label']); ?></option>
          <?php endforeach; ?>
        </select>
        <button class="kit-button" data-variant="secondary" type="submit">Sort</button>
      </form>
      <?php endif; ?>
    </div>
    <?php endif; ?>
    <ul class="kit-grid kit-shop-grid" data-cols="<?php echo kit_e($content['columns']); ?>" data-min="xs" role="list">
      <?php foreach ($content['products'] as $product): ?>
      <li class="kit-product-card"<?php echo kit_e((($product['badge'] === 'sold-out') ? ' data-sold-out' : '')); ?>>
        <div class="kit-product-media">
          <?php if ($product['image']): ?>
          <img src="<?php echo kit_e(kit_url($product['image']['src'])); ?>" alt="" <?php if (isset($product['image']['width'])): ?>width="<?php echo kit_e($product['image']['width']); ?>" height="<?php echo kit_e(($product['image']['height'] ?? '')); ?>" <?php endif; ?> loading="lazy">
          <?php else: ?>
          <span class="kit-product-placeholder"><?php echo kit_e(kit_icon('box')); ?></span>
          <?php endif; ?>
          <?php if (($product['badge'] === 'sale')): ?>
          <span class="kit-product-badge" data-badge="sale">Sale</span>
          <?php elseif (($product['badge'] === 'sold-out')): ?>
          <span class="kit-product-badge" data-badge="sold-out">Sold out</span>
          <?php elseif (($product['badge'] === 'new')): ?>
          <span class="kit-product-badge" data-badge="new">New</span>
          <?php endif; ?>
          <?php if (($product['add_url'] && ($product['badge'] !== 'sold-out'))): ?>
          <a class="kit-product-add" href="<?php echo kit_e(kit_url($product['add_url'])); ?>"><?php echo kit_e(kit_icon('bag')); ?><span><?php echo kit_e($product['add_label']); ?></span><span class="kit-vh">: <?php echo kit_e($product['name']); ?></span></a>
          <?php endif; ?>
        </div>
        <h3 class="kit-product-name"><?php if ($product['url']): ?><a class="kit-product-link" href="<?php echo kit_e(kit_url($product['url'])); ?>"><?php echo kit_e($product['name']); ?></a><?php else: ?><?php echo kit_e($product['name']); ?><?php endif; ?></h3>
<?php if ($product['description']): ?>
        <p class="kit-product-description"><?php echo kit_e($product['description']); ?></p>
<?php endif; ?>
        <p class="<?php echo kit_e(($product['label'] ? 'kit-product-label' : 'kit-product-price')); ?>"><?php if ($product['label']): ?><?php echo kit_e($product['label']); ?><?php elseif ($product['was_price']): ?><span class="kit-product-now"><span class="kit-vh">Now </span><?php echo kit_e($product['price']); ?></span> <s class="kit-product-was"><span class="kit-vh">was </span><?php echo kit_e($product['was_price']); ?></s><?php else: ?><?php echo kit_e($product['price']); ?><?php endif; ?></p>
      </li>
      <?php endforeach; ?>
    </ul>
  </div>
</section>
<?php
};
