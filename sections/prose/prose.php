<?php
// Compiled by kit from sections/prose/prose.blade.php. Don't edit it: change the template and run `kit section compile`.
return function ($content = [], $variant = 'default'): void {
?>

<section class="kit-section-prose" data-background="<?php echo kit_e($content['background']); ?>" data-width="<?php echo kit_e($content['width']); ?>">
  <div class="kit-container">
    <div class="kit-prose"<?php if (($variant === 'left')): ?> data-align="start"<?php endif; ?>>
      <?php foreach ($content['blocks'] as $block): ?>
      <?php if (($block['kind'] === 'heading')): ?>
      <<?php echo kit_e(kit_heading($block['heading_level'])); ?> class="kit-prose-heading"><?php if ($block['number']): ?><span class="kit-prose-number"><?php echo kit_e($block['number']); ?></span> <?php endif; ?><?php echo kit_e(kit_rich($block['text'])); ?></<?php echo kit_e(kit_heading($block['heading_level'])); ?>>
      <?php elseif (($block['kind'] === 'list')): ?>
      <?php if ($block['ordered']): ?>
      <ol class="kit-prose-list">
        <?php foreach ($block['items'] as $point): ?>
        <li><?php echo kit_e(kit_rich($point['text'])); ?></li>
        <?php endforeach; ?>
      </ol>
      <?php else: ?>
      <ul class="kit-prose-list">
        <?php foreach ($block['items'] as $point): ?>
        <li><?php echo kit_e(kit_rich($point['text'])); ?></li>
        <?php endforeach; ?>
      </ul>
      <?php endif; ?>
      <?php elseif (($block['kind'] === 'quote')): ?>
      <figure class="kit-prose-quote">
        <blockquote><?php echo kit_e(kit_paragraphs($block['text'])); ?></blockquote>
        <?php if ($block['attribution']): ?>
        <figcaption><?php echo kit_e($block['attribution']); ?></figcaption>
        <?php endif; ?>
      </figure>
      <?php elseif (($block['kind'] === 'stats')): ?>
      <dl class="kit-prose-stats">
        <?php foreach ($block['stats'] as $stat): ?>
        <div class="kit-prose-stat">
          <dt><?php echo kit_e($stat['label']); ?></dt>
          <dd><?php echo kit_e($stat['value']); ?></dd>
        </div>
        <?php endforeach; ?>
      </dl>
      <?php elseif (($block['kind'] === 'code')): ?>
      <figure class="kit-prose-code">
        <?php if ($block['caption']): ?>
        <figcaption><?php echo kit_e(kit_rich($block['caption'])); ?></figcaption>
        <?php endif; ?>
        <pre tabindex="0"><code><?php echo kit_e($block['code']); ?></code></pre>
      </figure>
      <?php elseif (($block['kind'] === 'table')): ?>
      <div class="kit-prose-table" tabindex="0">
        <table>
          <?php if ($block['caption']): ?>
          <caption><?php echo kit_e(kit_rich($block['caption'])); ?></caption>
          <?php endif; ?>
          <?php if (count($block['columns'])): ?>
          <thead>
            <tr>
              <?php foreach ($block['columns'] as $column): ?>
              <th scope="col"><?php echo kit_e($column['text']); ?></th>
              <?php endforeach; ?>
            </tr>
          </thead>
          <?php endif; ?>
          <tbody>
            <?php foreach ($block['rows'] as $row): ?>
            <tr>
              <?php foreach ($row['cells'] as $i => $cell): ?>
              <?php if ((($i === 0) && $block['row_headers'])): ?>
              <th scope="row"><?php echo kit_e(kit_rich($cell['text'])); ?></th>
              <?php else: ?>
              <td><?php echo kit_e(kit_rich($cell['text'])); ?></td>
              <?php endif; ?>
              <?php endforeach; ?>
            </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
      <?php elseif (($block['kind'] === 'figure')): ?>
      <figure class="kit-prose-figure" data-size="<?php echo kit_e($block['size']); ?>">
        <?php if ($block['image']): ?>
        <img class="kit-prose-media" src="<?php echo kit_e(kit_url($block['image']['src'])); ?>" alt="<?php echo kit_e(($block['image']['alt'] ?? '')); ?>" <?php if (isset($block['image']['width'])): ?>width="<?php echo kit_e($block['image']['width']); ?>" height="<?php echo kit_e(($block['image']['height'] ?? '')); ?>" <?php endif; ?> loading="lazy">
        <?php else: ?>
        <div class="kit-prose-media" data-empty><?php echo kit_e(kit_icon('image')); ?></div>
        <?php endif; ?>
        <?php if ($block['caption']): ?>
        <figcaption><?php echo kit_e(kit_rich($block['caption'])); ?></figcaption>
        <?php endif; ?>
      </figure>
      <?php else: ?>
      <?php echo kit_e(kit_paragraphs($block['text'])); ?>

      <?php endif; ?>
      <?php endforeach; ?>
    </div>
  </div>
</section>
<?php
};
