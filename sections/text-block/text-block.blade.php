{{-- kit section: text block. Edit this, then run `kit section compile`. --}}
@props(['content' => [], 'variant' => 'default'])
<section class="kit-section-text-block" data-background="{{ $content['background'] }}">
  <div class="kit-container">
    <div class="kit-text-block"@if($variant === 'centred') data-align="centre"@endif>
      @if($content['eyebrow'])
      <p class="kit-text-block-eyebrow">{{ $content['eyebrow'] }}</p>
      @endif
      <{{ kit_heading($content['heading_level']) }} class="kit-text-block-title">{{ kit_rich($content['title']) }}</{{ kit_heading($content['heading_level']) }}>
      @if($content['body'])
      <div class="kit-text-block-body">{{ kit_paragraphs($content['body']) }}</div>
      @endif
      @if(count($content['points']))
      <ul class="kit-text-block-points" role="list">
        @foreach($content['points'] as $point)
        <li>{{ $point['text'] }}</li>
        @endforeach
      </ul>
      @endif
      @if($content['link_label'] && $content['link_url'])
      <p class="kit-text-block-actions"><a class="kit-link" data-variant="arrow" href="{{ kit_url($content['link_url']) }}">{{ $content['link_label'] }}</a></p>
      @endif
    </div>
  </div>
</section>
