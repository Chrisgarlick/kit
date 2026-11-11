<?php
// Compiled by kit from sections/basket-drawer/basket-drawer.blade.php. Don't edit it: change the template and run `kit section compile`.
return function ($content = [], $variant = 'drawer'): void {
?>

<?php if (($variant === 'page')): ?>
<section class="kit-section-basket-drawer" data-variant="page">
  <div class="kit-container">
    <div class="kit-basket" aria-labelledby="kit-basket-title">
      <h1 class="kit-basket-title" id="kit-basket-title"><?php echo kit_e($content['title']); ?> <span class="kit-basket-count">(<?php echo kit_e(count($content['items'])); ?>)</span></h1>
      <?php if (count($content['items'])): ?>
      <?php if ($content['delivery_text']): ?>
      <div class="kit-basket-delivery">
        <p><?php echo kit_e(kit_rich($content['delivery_text'])); ?></p>
        <progress class="kit-progress" max="100" value="<?php echo kit_e(($content['delivery_progress'] ?? 0)); ?>" aria-label="Towards free delivery"><?php echo kit_e(($content['delivery_progress'] ?? 0)); ?>%</progress>
      </div>
      <?php endif; ?>
      <form class="kit-basket-form" method="post" action="<?php echo kit_e(kit_url($content['update_url'])); ?>">
        <ul class="kit-basket-items" role="list">
          <?php foreach ($content['items'] as $i => $item): ?>
          <li class="kit-basket-item">
            <span class="kit-basket-thumb"><?php if ($item['image']): ?><img src="<?php echo kit_e(kit_url($item['image']['src'])); ?>" alt="" loading="lazy"><?php endif; ?></span>
            <div class="kit-basket-info">
              <p class="kit-basket-name"><?php if ($item['url']): ?><a href="<?php echo kit_e(kit_url($item['url'])); ?>"><?php echo kit_e($item['name']); ?></a><?php else: ?><?php echo kit_e($item['name']); ?><?php endif; ?></p>
              <?php if ($item['options']): ?>
              <p class="kit-basket-options"><?php echo kit_e($item['options']); ?></p>
              <?php endif; ?>
              <label class="kit-basket-qty"><span class="kit-vh">Quantity of <?php echo kit_e($item['name']); ?></span><input class="kit-input" type="number" name="quantity[<?php echo kit_e($i); ?>]" value="<?php echo kit_e(($item['quantity'] ?? 1)); ?>" min="0" max="99" inputmode="numeric"></label>
            </div>
            <p class="kit-basket-price"><?php echo kit_e($item['price']); ?></p>
          </li>
          <?php endforeach; ?>
        </ul>
        <button class="kit-button kit-basket-update" data-variant="ghost" data-size="sm" type="submit">Update basket</button>
      </form>
      <div class="kit-basket-foot">
        <p class="kit-basket-subtotal"><span>Subtotal</span><strong><?php echo kit_e($content['subtotal']); ?></strong></p>
        <?php if ($content['note']): ?>
        <p class="kit-basket-note"><?php echo kit_e($content['note']); ?></p>
        <?php endif; ?>
        <?php if ($content['checkout_url']): ?>
        <a class="kit-button kit-basket-checkout" data-variant="primary" data-size="lg" href="<?php echo kit_e(kit_url($content['checkout_url'])); ?>"><?php echo kit_e($content['checkout_label']); ?></a>
        <?php endif; ?>
        <?php if ($content['continue_url']): ?>
        <a class="kit-link kit-basket-continue" href="<?php echo kit_e(kit_url($content['continue_url'])); ?>"><?php echo kit_e($content['continue_label']); ?></a>
        <?php endif; ?>
      </div>
      <?php else: ?>
      <p class="kit-basket-empty"><?php echo kit_e($content['empty_text']); ?></p>
      <?php if ($content['continue_url']): ?>
      <a class="kit-button" data-variant="secondary" href="<?php echo kit_e(kit_url($content['continue_url'])); ?>"><?php echo kit_e($content['continue_label']); ?></a>
      <?php endif; ?>
      <?php endif; ?>
    </div>
  </div>
</section>
<?php else: ?>
<div class="kit-section-basket-drawer" data-variant="drawer">
  <button class="kit-button kit-basket-open" data-variant="secondary" type="button" commandfor="kit-basket" command="show-modal"><?php echo kit_e(kit_icon('bag')); ?><span><?php echo kit_e($content['button_label']); ?></span> <span class="kit-basket-badge"><?php echo kit_e(count($content['items'])); ?><span class="kit-vh"> items</span></span></button>
  <dialog class="kit-dialog kit-drawer kit-basket" id="kit-basket" aria-labelledby="kit-basket-title" closedby="any">
    <header class="kit-dialog-header">
      <h2 class="kit-basket-title" id="kit-basket-title"><?php echo kit_e($content['title']); ?> <span class="kit-basket-count">(<?php echo kit_e(count($content['items'])); ?>)</span></h2>
      <button class="kit-button" data-variant="ghost" data-icon type="button" commandfor="kit-basket" command="close" aria-label="Close"><?php echo kit_e(kit_icon('x')); ?></button>
    </header>
    <div class="kit-dialog-body kit-basket-body">
    <?php if (count($content['items'])): ?>
    <?php if ($content['delivery_text']): ?>
    <div class="kit-basket-delivery">
      <p><?php echo kit_e(kit_rich($content['delivery_text'])); ?></p>
      <progress class="kit-progress" max="100" value="<?php echo kit_e(($content['delivery_progress'] ?? 0)); ?>" aria-label="Towards free delivery"><?php echo kit_e(($content['delivery_progress'] ?? 0)); ?>%</progress>
    </div>
    <?php endif; ?>
    <form class="kit-basket-form" method="post" action="<?php echo kit_e(kit_url($content['update_url'])); ?>">
      <ul class="kit-basket-items" role="list">
        <?php foreach ($content['items'] as $i => $item): ?>
        <li class="kit-basket-item">
          <span class="kit-basket-thumb"><?php if ($item['image']): ?><img src="<?php echo kit_e(kit_url($item['image']['src'])); ?>" alt="" loading="lazy"><?php endif; ?></span>
          <div class="kit-basket-info">
            <p class="kit-basket-name"><?php if ($item['url']): ?><a href="<?php echo kit_e(kit_url($item['url'])); ?>"><?php echo kit_e($item['name']); ?></a><?php else: ?><?php echo kit_e($item['name']); ?><?php endif; ?></p>
            <?php if ($item['options']): ?>
            <p class="kit-basket-options"><?php echo kit_e($item['options']); ?></p>
            <?php endif; ?>
            <label class="kit-basket-qty"><span class="kit-vh">Quantity of <?php echo kit_e($item['name']); ?></span><input class="kit-input" type="number" name="quantity[<?php echo kit_e($i); ?>]" value="<?php echo kit_e(($item['quantity'] ?? 1)); ?>" min="0" max="99" inputmode="numeric"></label>
          </div>
          <p class="kit-basket-price"><?php echo kit_e($item['price']); ?></p>
        </li>
        <?php endforeach; ?>
      </ul>
      <button class="kit-button kit-basket-update" data-variant="ghost" data-size="sm" type="submit">Update basket</button>
    </form>
    <div class="kit-basket-foot">
      <p class="kit-basket-subtotal"><span>Subtotal</span><strong><?php echo kit_e($content['subtotal']); ?></strong></p>
      <?php if ($content['note']): ?>
      <p class="kit-basket-note"><?php echo kit_e($content['note']); ?></p>
      <?php endif; ?>
      <?php if ($content['checkout_url']): ?>
      <a class="kit-button kit-basket-checkout" data-variant="primary" data-size="lg" href="<?php echo kit_e(kit_url($content['checkout_url'])); ?>"><?php echo kit_e($content['checkout_label']); ?></a>
      <?php endif; ?>
      <?php if ($content['continue_url']): ?>
      <a class="kit-link kit-basket-continue" href="<?php echo kit_e(kit_url($content['continue_url'])); ?>"><?php echo kit_e($content['continue_label']); ?></a>
      <?php endif; ?>
    </div>
    <?php else: ?>
    <p class="kit-basket-empty"><?php echo kit_e($content['empty_text']); ?></p>
    <?php if ($content['continue_url']): ?>
    <a class="kit-button" data-variant="secondary" href="<?php echo kit_e(kit_url($content['continue_url'])); ?>"><?php echo kit_e($content['continue_label']); ?></a>
    <?php endif; ?>
    <?php endif; ?>
    </div>
  </dialog>
</div>
<?php endif; ?>
<?php
};
