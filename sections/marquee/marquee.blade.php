{{-- kit section: marquee. Edit this, then run `kit section compile`. --}}
@props(['content' => [], 'variant' => 'default'])
<section class="kit-section-marquee" data-tone="{{ $content['tone'] }}" data-speed="{{ $content['speed'] }}">
  <label class="kit-marquee-pause"><input type="checkbox"> Pause the moving text</label>
  <div class="kit-marquee">
    <div class="kit-marquee-track">
      <ul class="kit-marquee-run" role="list">
        @foreach($content['phrases'] as $phrase)
        <li><span class="kit-marquee-phrase">{{ kit_rich($phrase['text']) }}</span><span class="kit-marquee-sep" aria-hidden="true">{{ $content['separator'] }}</span></li>
        @endforeach
      </ul>
      <ul class="kit-marquee-run" role="list" aria-hidden="true">
        @foreach($content['phrases'] as $phrase)
        <li><span class="kit-marquee-phrase">{{ kit_rich($phrase['text']) }}</span><span class="kit-marquee-sep">{{ $content['separator'] }}</span></li>
        @endforeach
      </ul>
    </div>
  </div>
</section>
