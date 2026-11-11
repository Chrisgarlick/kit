{{-- kit section: pill row. Edit this, then run `kit section compile`. --}}
@props(['content' => [], 'variant' => 'default'])
<section class="kit-section-pill-row" data-background="{{ $content['background'] }}">
  <div class="kit-container kit-pills-row">
    @if($content['label'])
    <p class="kit-pills-label">{{ $content['label'] }}</p>
    @endif
    <ul class="kit-pills" role="list">
      @foreach($content['pills'] as $pill)
      @if($pill['url'])
      <li><a class="kit-pill" href="{{ kit_url($pill['url']) }}">{{ $pill['text'] }}</a></li>
      @else
      <li><span class="kit-pill">{{ $pill['text'] }}</span></li>
      @endif
      @endforeach
    </ul>
  </div>
</section>
