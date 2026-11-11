{{-- kit section: basket. Edit this, then run `kit section compile`. --}}
@props(['content' => [], 'variant' => 'drawer'])
@if($variant === 'page')
<section class="kit-section-basket-drawer" data-variant="page">
  <div class="kit-container">
    <div class="kit-basket" aria-labelledby="kit-basket-title">
      <h1 class="kit-basket-title" id="kit-basket-title">{{ $content['title'] }} <span class="kit-basket-count">({{ count($content['items']) }})</span></h1>
      @if(count($content['items']))
      @if($content['delivery_text'])
      <div class="kit-basket-delivery">
        <p>{{ kit_rich($content['delivery_text']) }}</p>
        <progress class="kit-progress" max="100" value="{{ $content['delivery_progress'] ?? 0 }}" aria-label="Towards free delivery">{{ $content['delivery_progress'] ?? 0 }}%</progress>
      </div>
      @endif
      <form class="kit-basket-form" method="post" action="{{ kit_url($content['update_url']) }}">
        <ul class="kit-basket-items" role="list">
          @foreach($content['items'] as $i => $item)
          <li class="kit-basket-item">
            <span class="kit-basket-thumb">@if($item['image'])<img src="{{ kit_url($item['image']['src']) }}" alt="" loading="lazy">@endif</span>
            <div class="kit-basket-info">
              <p class="kit-basket-name">@if($item['url'])<a href="{{ kit_url($item['url']) }}">{{ $item['name'] }}</a>@else{{ $item['name'] }}@endif</p>
              @if($item['options'])
              <p class="kit-basket-options">{{ $item['options'] }}</p>
              @endif
              <label class="kit-basket-qty"><span class="kit-vh">Quantity of {{ $item['name'] }}</span><input class="kit-input" type="number" name="quantity[{{ $i }}]" value="{{ $item['quantity'] ?? 1 }}" min="0" max="99" inputmode="numeric"></label>
            </div>
            <p class="kit-basket-price">{{ $item['price'] }}</p>
          </li>
          @endforeach
        </ul>
        <button class="kit-button kit-basket-update" data-variant="ghost" data-size="sm" type="submit">Update basket</button>
      </form>
      <div class="kit-basket-foot">
        <p class="kit-basket-subtotal"><span>Subtotal</span><strong>{{ $content['subtotal'] }}</strong></p>
        @if($content['note'])
        <p class="kit-basket-note">{{ $content['note'] }}</p>
        @endif
        @if($content['checkout_url'])
        <a class="kit-button kit-basket-checkout" data-variant="primary" data-size="lg" href="{{ kit_url($content['checkout_url']) }}">{{ $content['checkout_label'] }}</a>
        @endif
        @if($content['continue_url'])
        <a class="kit-link kit-basket-continue" href="{{ kit_url($content['continue_url']) }}">{{ $content['continue_label'] }}</a>
        @endif
      </div>
      @else
      <p class="kit-basket-empty">{{ $content['empty_text'] }}</p>
      @if($content['continue_url'])
      <a class="kit-button" data-variant="secondary" href="{{ kit_url($content['continue_url']) }}">{{ $content['continue_label'] }}</a>
      @endif
      @endif
    </div>
  </div>
</section>
@else
<div class="kit-section-basket-drawer" data-variant="drawer">
  <button class="kit-button kit-basket-open" data-variant="secondary" type="button" commandfor="kit-basket" command="show-modal">{{ kit_icon('bag') }}<span>{{ $content['button_label'] }}</span> <span class="kit-basket-badge">{{ count($content['items']) }}<span class="kit-vh"> items</span></span></button>
  <dialog class="kit-dialog kit-drawer kit-basket" id="kit-basket" aria-labelledby="kit-basket-title" closedby="any">
    <header class="kit-dialog-header">
      <h2 class="kit-basket-title" id="kit-basket-title">{{ $content['title'] }} <span class="kit-basket-count">({{ count($content['items']) }})</span></h2>
      <button class="kit-button" data-variant="ghost" data-icon type="button" commandfor="kit-basket" command="close" aria-label="Close">{{ kit_icon('x') }}</button>
    </header>
    <div class="kit-dialog-body kit-basket-body">
    @if(count($content['items']))
    @if($content['delivery_text'])
    <div class="kit-basket-delivery">
      <p>{{ kit_rich($content['delivery_text']) }}</p>
      <progress class="kit-progress" max="100" value="{{ $content['delivery_progress'] ?? 0 }}" aria-label="Towards free delivery">{{ $content['delivery_progress'] ?? 0 }}%</progress>
    </div>
    @endif
    <form class="kit-basket-form" method="post" action="{{ kit_url($content['update_url']) }}">
      <ul class="kit-basket-items" role="list">
        @foreach($content['items'] as $i => $item)
        <li class="kit-basket-item">
          <span class="kit-basket-thumb">@if($item['image'])<img src="{{ kit_url($item['image']['src']) }}" alt="" loading="lazy">@endif</span>
          <div class="kit-basket-info">
            <p class="kit-basket-name">@if($item['url'])<a href="{{ kit_url($item['url']) }}">{{ $item['name'] }}</a>@else{{ $item['name'] }}@endif</p>
            @if($item['options'])
            <p class="kit-basket-options">{{ $item['options'] }}</p>
            @endif
            <label class="kit-basket-qty"><span class="kit-vh">Quantity of {{ $item['name'] }}</span><input class="kit-input" type="number" name="quantity[{{ $i }}]" value="{{ $item['quantity'] ?? 1 }}" min="0" max="99" inputmode="numeric"></label>
          </div>
          <p class="kit-basket-price">{{ $item['price'] }}</p>
        </li>
        @endforeach
      </ul>
      <button class="kit-button kit-basket-update" data-variant="ghost" data-size="sm" type="submit">Update basket</button>
    </form>
    <div class="kit-basket-foot">
      <p class="kit-basket-subtotal"><span>Subtotal</span><strong>{{ $content['subtotal'] }}</strong></p>
      @if($content['note'])
      <p class="kit-basket-note">{{ $content['note'] }}</p>
      @endif
      @if($content['checkout_url'])
      <a class="kit-button kit-basket-checkout" data-variant="primary" data-size="lg" href="{{ kit_url($content['checkout_url']) }}">{{ $content['checkout_label'] }}</a>
      @endif
      @if($content['continue_url'])
      <a class="kit-link kit-basket-continue" href="{{ kit_url($content['continue_url']) }}">{{ $content['continue_label'] }}</a>
      @endif
    </div>
    @else
    <p class="kit-basket-empty">{{ $content['empty_text'] }}</p>
    @if($content['continue_url'])
    <a class="kit-button" data-variant="secondary" href="{{ kit_url($content['continue_url']) }}">{{ $content['continue_label'] }}</a>
    @endif
    @endif
    </div>
  </dialog>
</div>
@endif
