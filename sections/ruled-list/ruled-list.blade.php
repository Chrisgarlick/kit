{{-- kit section: ruled list. Edit this, then run `kit section compile`. --}}
@props(['content' => [], 'variant' => 'default'])
<section class="kit-section-ruled-list" data-tone="{{ $content['tone'] }}">
  <div class="kit-container">
    @if($content['eyebrow'] || $content['title'] || $content['lede'])
    <div class="kit-section-head">
      <div class="kit-section-head-text">
        @if($content['eyebrow'])
        <p class="kit-section-head-eyebrow">{{ $content['eyebrow'] }}</p>
        @endif
        @if($content['title'])
        <{{ kit_heading($content['heading_level']) }} class="kit-section-head-title">{{ kit_rich($content['title']) }}</{{ kit_heading($content['heading_level']) }}>
        @endif
        @if($content['lede'])
        <p class="kit-section-head-lede">{{ kit_rich($content['lede']) }}</p>
        @endif
      </div>
    </div>
    @endif
    <ol class="kit-ruled-list" role="list">
      @foreach($content['rows'] as $row)
      <li class="kit-ruled-row">
        @if($row['number'])
        <span class="kit-ruled-num">{{ $row['number'] }}</span>
        @else
        <span class="kit-ruled-num" data-auto aria-hidden="true"></span>
        @endif
        @if($row['url'])
        <p class="kit-ruled-name"><a href="{{ kit_url($row['url']) }}">{{ kit_rich($row['name']) }}</a></p>
        @else
        <p class="kit-ruled-name">{{ kit_rich($row['name']) }}</p>
        @endif
        @if($row['value'])
        <p class="kit-ruled-value">{{ $row['value'] }}</p>
        @endif
        @if($row['text'])
        <p class="kit-ruled-text">{{ $row['text'] }}</p>
        @endif
      </li>
      @endforeach
    </ol>
  </div>
</section>
