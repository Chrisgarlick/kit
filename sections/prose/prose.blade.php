{{-- kit section: prose. Edit this, then run `kit section compile`. --}}
@props(['content' => [], 'variant' => 'default'])
<section class="kit-section-prose" data-background="{{ $content['background'] }}" data-width="{{ $content['width'] }}">
  <div class="kit-container">
    <div class="kit-prose"@if($variant === 'left') data-align="start"@endif>
      @foreach($content['blocks'] as $block)
      @if($block['kind'] === 'heading')
      <{{ kit_heading($block['heading_level']) }} class="kit-prose-heading">@if($block['number'])<span class="kit-prose-number">{{ $block['number'] }}</span> @endif{{ kit_rich($block['text']) }}</{{ kit_heading($block['heading_level']) }}>
      @elseif($block['kind'] === 'list')
      @if($block['ordered'])
      <ol class="kit-prose-list">
        @foreach($block['items'] as $point)
        <li>{{ kit_rich($point['text']) }}</li>
        @endforeach
      </ol>
      @else
      <ul class="kit-prose-list">
        @foreach($block['items'] as $point)
        <li>{{ kit_rich($point['text']) }}</li>
        @endforeach
      </ul>
      @endif
      @elseif($block['kind'] === 'quote')
      <figure class="kit-prose-quote">
        <blockquote>{{ kit_paragraphs($block['text']) }}</blockquote>
        @if($block['attribution'])
        <figcaption>{{ $block['attribution'] }}</figcaption>
        @endif
      </figure>
      @elseif($block['kind'] === 'stats')
      <dl class="kit-prose-stats">
        @foreach($block['stats'] as $stat)
        <div class="kit-prose-stat">
          <dt>{{ $stat['label'] }}</dt>
          <dd>{{ $stat['value'] }}</dd>
        </div>
        @endforeach
      </dl>
      @elseif($block['kind'] === 'code')
      <figure class="kit-prose-code">
        @if($block['caption'])
        <figcaption>{{ kit_rich($block['caption']) }}</figcaption>
        @endif
        <pre tabindex="0"><code>{{ $block['code'] }}</code></pre>
      </figure>
      @elseif($block['kind'] === 'table')
      <div class="kit-prose-table" tabindex="0">
        <table>
          @if($block['caption'])
          <caption>{{ kit_rich($block['caption']) }}</caption>
          @endif
          @if(count($block['columns']))
          <thead>
            <tr>
              @foreach($block['columns'] as $column)
              <th scope="col">{{ $column['text'] }}</th>
              @endforeach
            </tr>
          </thead>
          @endif
          <tbody>
            @foreach($block['rows'] as $row)
            <tr>
              @foreach($row['cells'] as $i => $cell)
              @if($i === 0 && $block['row_headers'])
              <th scope="row">{{ kit_rich($cell['text']) }}</th>
              @else
              <td>{{ kit_rich($cell['text']) }}</td>
              @endif
              @endforeach
            </tr>
            @endforeach
          </tbody>
        </table>
      </div>
      @elseif($block['kind'] === 'figure')
      <figure class="kit-prose-figure" data-size="{{ $block['size'] }}">
        @if($block['image'])
        <img class="kit-prose-media" src="{{ kit_url($block['image']['src']) }}" alt="{{ $block['image']['alt'] ?? '' }}" @isset($block['image']['width'])width="{{ $block['image']['width'] }}" height="{{ $block['image']['height'] ?? '' }}" @endisset @isset($block['image']['srcset'])srcset="{{ $block['image']['srcset'] }}" sizes="(min-width: 64rem) 64rem, 100vw" @endisset loading="lazy">
        @else
        <div class="kit-prose-media" data-empty>{{ kit_icon('image') }}</div>
        @endif
        @if($block['caption'])
        <figcaption>{{ kit_rich($block['caption']) }}</figcaption>
        @endif
      </figure>
      @else
      {{ kit_paragraphs($block['text']) }}
      @endif
      @endforeach
    </div>
  </div>
</section>
