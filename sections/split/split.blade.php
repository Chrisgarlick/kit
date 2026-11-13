{{-- kit section: split. Edit this, then run `kit section compile`. --}}
@props(['content' => [], 'variant' => 'default'])
<section class="kit-section-split" data-background="{{ $content['background'] }}" data-media="{{ $content['media'] }}"{{ $content['swap'] ? ' data-swap' : '' }}@if($content['panel'] !== 'none') data-panel="{{ $content['panel'] }}"@endif>
  <div class="kit-container kit-split-inner">
    <div class="kit-text-block kit-split-text">
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
        <li{{ $point['excluded'] ? ' data-excluded' : '' }}>@if($point['excluded'])<span class="kit-vh">Not included: </span>@endif{{ $point['text'] }}</li>
        @endforeach
      </ul>
      @endif
      @if($content['link_label'] && $content['link_url'])
      <p class="kit-text-block-actions"><a class="kit-link" data-variant="arrow" href="{{ kit_url($content['link_url']) }}">{{ $content['link_label'] }}</a></p>
      @endif
    </div>
    @if($content['media'] === 'questions')
    <div class="kit-split-questions">
      @foreach($content['questions'] as $i => $item)
      <details class="kit-accordion"{{ $i === 0 ? ' open' : '' }}>
@if($content['numbered'])
        <summary><span class="kit-split-number" aria-hidden="true">{{ ($i === 9 || $i === 10 || $i === 11) ? '' : '0' }}{{ $i + 1 }}</span><span class="kit-split-question">{{ $item['question'] }}</span></summary>
@else
        <summary>{{ $item['question'] }}</summary>
@endif
        <div class="kit-accordion-body">{{ kit_paragraphs($item['answer']) }}</div>
      </details>
      @endforeach
    </div>
    @elseif($content['media'] === 'card')
    <div class="kit-split-card">
@if($content['card_label'])
      <p class="kit-split-card-label">{{ $content['card_label'] }}</p>
@endif
@if($content['card_title'])
      <p class="kit-split-card-title">{{ kit_rich($content['card_title']) }}</p>
@endif
@if($content['card_text'])
      <p class="kit-split-card-text">{{ $content['card_text'] }}</p>
@endif
    </div>
    @elseif($content['image'])
@if($content['caption'])
    <figure class="kit-split-figure">
      <img class="kit-split-media" src="{{ kit_url($content['image']['src']) }}" alt="{{ $content['image']['alt'] }}" @isset($content['image']['width'])width="{{ $content['image']['width'] }}" height="{{ $content['image']['height'] ?? '' }}" @endisset loading="lazy">
      <figcaption class="kit-split-caption">{{ $content['caption'] }}</figcaption>
    </figure>
@else
    <img class="kit-split-media" src="{{ kit_url($content['image']['src']) }}" alt="{{ $content['image']['alt'] }}" @isset($content['image']['width'])width="{{ $content['image']['width'] }}" height="{{ $content['image']['height'] ?? '' }}" @endisset loading="lazy">
@endif
    @else
@if($content['caption'])
    <figure class="kit-split-figure">
      <div class="kit-split-media" data-empty><svg aria-hidden="true" viewBox="0 0 24 24" width="36" height="36"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg></div>
      <figcaption class="kit-split-caption">{{ $content['caption'] }}</figcaption>
    </figure>
@else
    <div class="kit-split-media" data-empty><svg aria-hidden="true" viewBox="0 0 24 24" width="36" height="36"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg></div>
@endif
    @endif
  </div>
</section>
